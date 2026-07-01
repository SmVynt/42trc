// Email validation for 42 school students
const allowedSchoolEmailDomains = ['student.42.fr', '42.fr', 'intra.42.fr'];

/**
 * Проверяет, является ли email учебным адресом школы 42
 */
const isAllowedSchoolEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  
  const domain = email.split('@')[1];
  return allowedSchoolEmailDomains.includes(domain);
};

module.exports = {
  isAllowedSchoolEmail,
  allowedSchoolEmailDomains,
};
