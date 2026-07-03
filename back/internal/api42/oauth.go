package api42

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"
)

const BaseURL = "https://api.intra.42.fr"
const maxRetries = 5

var httpClient = &http.Client{
	Timeout: 60 * time.Second,
	Transport: &http.Transport{
		MaxIdleConns:      100,
		IdleConnTimeout:   90 * time.Second,
		ForceAttemptHTTP2: true,
	},
}

type tokenResponse struct {
	AccessToken      string `json:"access_token"`
	ExpiresIn        int    `json:"expires_in"`
	Error            string `json:"error"`
	ErrorDescription string `json:"error_description"`
}

// ExchangeCode swaps an authorization_code for a user access token
func ExchangeCode(ctx context.Context, code, state string) (string, error) {
	clientID := os.Getenv("OAUTH_42_CLIENT_ID")
	clientSecret := os.Getenv("OAUTH_42_CLIENT_SECRET")
	if clientID == "" || clientSecret == "" {
		return "", fmt.Errorf("42 OAuth is not configured")
	}
	redirectURI := os.Getenv("OAUTH_42_REDIRECT_URI")
	if redirectURI == "" {
		redirectURI = "http://localhost:5173/login"
	}

	form := url.Values{}
	form.Set("grant_type", "authorization_code")
	form.Set("client_id", clientID)
	form.Set("client_secret", clientSecret)
	form.Set("code", code)
	form.Set("redirect_uri", redirectURI)
	if state != "" {
		form.Set("state", state)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost,
		BaseURL+"/oauth/token", strings.NewReader(form.Encode()))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	res, err := httpClient.Do(req)
	if err != nil {
		return "", err
	}
	defer res.Body.Close()

	var data tokenResponse
	if err := json.NewDecoder(res.Body).Decode(&data); err != nil {
		return "", err
	}
	if res.StatusCode != http.StatusOK || data.AccessToken == "" {
		msg := data.ErrorDescription
		if msg == "" {
			msg = data.Error
		}
		if msg == "" {
			msg = "could not exchange the authorization code"
		}
		return "", fmt.Errorf("%s", msg)
	}
	return data.AccessToken, nil
}

// FetchMe returns the profile of the user owning the given access token
func FetchMe(ctx context.Context, accessToken string) (*Profile, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, BaseURL+"/v2/me", nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+accessToken)

	res, err := httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()

	if res.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("could not fetch the 42 user profile (HTTP %d)", res.StatusCode)
	}

	var p Profile
	if err := json.NewDecoder(res.Body).Decode(&p); err != nil {
		return nil, err
	}
	return &p, nil
}

// Client talks to the 42 Intra API using an app (client_credentials) token
type Client struct {
	token     string
	expiresAt time.Time
}

// NewClient fetches an app token (with retries) and returns a ready-to-use client
func NewClient(ctx context.Context) (*Client, error) {
	appClientID := os.Getenv("OAUTH_42_CLIENT_ID")
	appClientSecret := os.Getenv("OAUTH_42_CLIENT_SECRET")
	if appClientID == "" || appClientSecret == "" {
		return nil, fmt.Errorf("OAUTH_42_CLIENT_ID / OAUTH_42_CLIENT_SECRET are not set")
	}

	form := url.Values{}
	form.Set("grant_type", "client_credentials")
	form.Set("client_id", appClientID)
	form.Set("client_secret", appClientSecret)

	var lastErr error
	for attempt := 1; attempt <= maxRetries; attempt++ {
		req, err := http.NewRequestWithContext(ctx, http.MethodPost,
			BaseURL+"/oauth/token", strings.NewReader(form.Encode()))
		if err != nil {
			return nil, err
		}
		req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

		res, err := httpClient.Do(req)
		if err != nil {
			lastErr = err
			time.Sleep(time.Duration(attempt*2) * time.Second)
			continue
		}

		var data tokenResponse
		decodeErr := json.NewDecoder(res.Body).Decode(&data)
		status := res.StatusCode
		res.Body.Close()

		if status == http.StatusTooManyRequests || status == http.StatusServiceUnavailable {
			lastErr = fmt.Errorf("token request HTTP %d", status)
			time.Sleep(time.Duration(attempt*2) * time.Second)
			continue
		}
		if decodeErr != nil {
			lastErr = decodeErr
			time.Sleep(time.Duration(attempt*2) * time.Second)
			continue
		}
		if status != http.StatusOK || data.AccessToken == "" {
			msg := data.ErrorDescription
			if msg == "" {
				msg = data.Error
			}
			return nil, fmt.Errorf("token request failed (%d): %s", status, msg)
		}

		return &Client{
			token:     data.AccessToken,
			expiresAt: time.Now().Add(time.Duration(data.ExpiresIn) * time.Second),
		}, nil
	}

	return nil, fmt.Errorf("token request failed after %d attempts: %w", maxRetries, lastErr)
}

// Token exposes the current app token (handy for quick checks)
func (c *Client) Token() string {
	return c.token
}

// Expired reports whether the app token is close to expiring
func (c *Client) Expired() bool {
	return time.Now().After(c.expiresAt.Add(-30 * time.Second))
}