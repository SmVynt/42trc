package api42

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

// get performs an authenticated GET with retries on 429/503/network errors
func (c *Client) get(ctx context.Context, path string, out interface{}) error {
	var lastErr error

	for attempt := 1; attempt <= maxRetries; attempt++ {
		req, err := http.NewRequestWithContext(ctx, http.MethodGet, BaseURL+path, nil)
		if err != nil {
			return err
		}
		req.Header.Set("Authorization", "Bearer "+c.token)

		res, err := httpClient.Do(req)
		if err != nil {
			lastErr = err
			time.Sleep(time.Duration(attempt) * time.Second)
			continue
		}

		if res.StatusCode == http.StatusTooManyRequests ||
			res.StatusCode == http.StatusServiceUnavailable {
			res.Body.Close()
			lastErr = fmt.Errorf("GET %s -> HTTP %d", path, res.StatusCode)
			time.Sleep(time.Duration(attempt) * time.Second)
			continue
		}
		if res.StatusCode != http.StatusOK {
			res.Body.Close()
			return fmt.Errorf("GET %s -> HTTP %d", path, res.StatusCode)
		}

		err = json.NewDecoder(res.Body).Decode(out)
		res.Body.Close()
		return err
	}

	return fmt.Errorf("GET %s failed after %d attempts: %w", path, maxRetries, lastErr)
}

// FetchUser returns the full profile for one login
func (c *Client) FetchUser(ctx context.Context, login string) (*Profile, error) {
	var p Profile
	if err := c.get(ctx, "/v2/users/"+login, &p); err != nil {
		return nil, err
	}
	return &p, nil
}

// CountStars returns how many scale_teams are flagged "Outstanding project" (flag id 9)
func (c *Client) CountStars(ctx context.Context, teamID int) (int, error) {
	var team Team
	if err := c.get(ctx, fmt.Sprintf("/v2/teams/%d", teamID), &team); err != nil {
		return 0, err
	}
	stars := 0
	for _, st := range team.ScaleTeams {
		if st.Flag.ID == 9 {
			stars++
		}
	}
	return stars, nil
}

// IsExam resolves the exam flag for a project id
func (c *Client) IsExam(ctx context.Context, projectID int) (bool, error) {
	var pd ProjectDetail
	if err := c.get(ctx, fmt.Sprintf("/v2/projects/%d", projectID), &pd); err != nil {
		return false, err
	}
	return pd.Exam, nil
}