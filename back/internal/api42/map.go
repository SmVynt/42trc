package api42

import (
	"strings"

	"github.com/SmVynt/42trc/back/models"
)

// profileToUser maps a 42 profile to a User model
func profileToUser(p *Profile) models.User {
	username := strings.ToLower(strings.TrimSpace(p.Login))
	email := strings.ToLower(strings.TrimSpace(p.Email))
	intra := p.Login
	if intra == "" {
		intra = username
	}
	intraID := p.ID

	return models.User{
		Username:        username,
		Email:           email,
		Intra:           intra,
		IntraID:         &intraID,
		Displayname:     p.Displayname,
		Image:           p.Image.Link,
		Wallet:          p.Wallet,
		CorrectionPoint: p.CorrectionPoint,
	}
}

// cursusToModel maps one cursus_user to a UserCursus model
func cursusToModel(userID uint, cu CursusUser) models.UserCursus {
	return models.UserCursus{
		UserID:       userID,
		CursusID:     cu.CursusID,
		CursusName:   cu.Cursus.Name,
		Level:        float32(cu.Level),
		Grade:        cu.Grade,
		BeginAt:      cu.BeginAt,
		BlackholedAt: cu.BlackholedAt,
	}
}

// projectToModel maps one project_user (+ computed stars/exam) to a UserProject model
func projectToModel(userID uint, pu ProjectUser, stars int, exam bool) models.UserProject {
	var cursusID *int
	if len(pu.CursusIDs) > 0 {
		cursusID = &pu.CursusIDs[0]
	}

	return models.UserProject{
		UserID:      userID,
		ProjectID:   pu.Project.ID,
		Occurrence:  pu.Occurrence,
		ProjectName: pu.Project.Name,
		CursusID:    cursusID,
		FinalMark:   pu.FinalMark,
		Status:      pu.Status,
		Validated:   pu.Validated,
		MarkedAt:    pu.MarkedAt,
		Stars:       stars,
		IsExam:      exam,
	}
}