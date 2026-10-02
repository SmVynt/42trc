package api42

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"
)

// get performs an authenticated GET with retries on 429/503/network errors
func (c *Client) get(ctx context.Context, path string, out interface{}) error {
	var lastErr error

	for attempt := 1; attempt <= maxRetries; attempt++ {
		if err := c.waitForRequest(ctx); err != nil {
			return err
		}
		req, err := http.NewRequestWithContext(ctx, http.MethodGet, BaseURL+path, nil)
		if err != nil {
			return err
		}
		req.Header.Set("Authorization", "Bearer "+c.token)

		res, err := httpClient.Do(req)
		if err != nil {
			lastErr = err
			if waitErr := wait(ctx, time.Duration(attempt)*time.Second); waitErr != nil {
				return waitErr
			}
			continue
		}

		if res.StatusCode == http.StatusTooManyRequests ||
			res.StatusCode == http.StatusServiceUnavailable {
			delay := time.Duration(1<<uint(attempt-1)) * time.Second
			if retryAfter, parseErr := strconv.Atoi(res.Header.Get("Retry-After")); parseErr == nil && retryAfter > 0 {
				delay = time.Duration(retryAfter) * time.Second
			}
			res.Body.Close()
			lastErr = fmt.Errorf("GET %s -> HTTP %d", path, res.StatusCode)
			c.pauseRequests(delay)
			if err := wait(ctx, delay); err != nil {
				return err
			}
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

func wait(ctx context.Context, delay time.Duration) error {
	timer := time.NewTimer(delay)
	defer timer.Stop()

	select {
	case <-timer.C:
		return nil
	case <-ctx.Done():
		return ctx.Err()
	}
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

func (c *Client) CountStarsBatch(ctx context.Context, teamIDs []int) (map[int]int, error) {
	if len(teamIDs) == 0 {
		return map[int]int{}, nil
	}

	var teams []Team
	path := fmt.Sprintf("/v2/teams?filter[id]=%s&page[size]=100", joinIDs(teamIDs))
	if err := c.get(ctx, path, &teams); err != nil {
		return nil, err
	}

	starsByTeam := make(map[int]int, len(teams))
	for _, team := range teams {
		stars := 0
		for _, scaleTeam := range team.ScaleTeams {
			if scaleTeam.Flag.ID == 9 {
				stars++
			}
		}
		starsByTeam[team.ID] = stars
	}
	return starsByTeam, nil
}

// IsExam resolves the exam flag for a project id
func (c *Client) IsExam(ctx context.Context, projectID int) (bool, error) {
	var pd ProjectDetail
	if err := c.get(ctx, fmt.Sprintf("/v2/projects/%d", projectID), &pd); err != nil {
		return false, err
	}
	return pd.Exam, nil
}

func (c *Client) IsExamBatch(ctx context.Context, projectIDs []int) (map[int]bool, error) {
	if len(projectIDs) == 0 {
		return map[int]bool{}, nil
	}

	var projects []ProjectDetail
	path := fmt.Sprintf("/v2/projects?filter[id]=%s&page[size]=100", joinIDs(projectIDs))
	if err := c.get(ctx, path, &projects); err != nil {
		return nil, err
	}

	examByProject := make(map[int]bool, len(projects))
	for _, project := range projects {
		examByProject[project.ID] = project.Exam
	}
	return examByProject, nil
}

func joinIDs(ids []int) string {
	values := make([]string, len(ids))
	for i, id := range ids {
		values[i] = strconv.Itoa(id)
	}
	return strings.Join(values, ",")
}
