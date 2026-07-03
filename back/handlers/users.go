package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// UserLevel is one row of the levels table shown on the frontend
type UserLevel struct {
	Username    string  `json:"username"`
	Displayname string  `json:"displayname"`
	Level       float32 `json:"level"`
	Projects    int     `json:"projects"`
	Exams       int     `json:"exams"`
	Stars       int     `json:"stars"`
}

// GetLevels returns nickname + level + counts, main course (cursus 21) only.
// Projects/exams are DISTINCT validated project_ids so retries count once.
func GetLevels(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		const coreCursusID = 21

		var rows []UserLevel
		err := db.Raw(`
			SELECT u.username, u.displayname, c.level,
				COUNT(DISTINCT p.project_id) FILTER (
					WHERE p.is_exam = false AND p.validated = true AND p.cursus_id = ?
				) AS projects,
				COUNT(DISTINCT p.project_id) FILTER (
					WHERE p.is_exam = true AND p.validated = true AND p.cursus_id = ?
				) AS exams,
				COALESCE(SUM(p.stars) FILTER (WHERE p.cursus_id = ?), 0) AS stars
			FROM users u
			LEFT JOIN user_cursus c
				ON c.user_id = u.id AND c.grade ILIKE 'cadet'
			LEFT JOIN user_projects p
				ON p.user_id = u.id
			GROUP BY u.id, u.username, u.displayname, c.level
			ORDER BY c.level DESC NULLS LAST, u.username ASC
		`, coreCursusID, coreCursusID, coreCursusID).Scan(&rows).Error

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to load levels."})
			return
		}

		c.JSON(http.StatusOK, gin.H{"users": rows})
	}
}