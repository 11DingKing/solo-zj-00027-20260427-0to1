using Microsoft.AspNetCore.Identity;

namespace OnlineExamSystem.Models;

public enum UserRole
{
    TEACHER,
    STUDENT
}

public class User : IdentityUser<int>
{
    public string Name { get; set; } = string.Empty;
    public UserRole Role { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public virtual ICollection<ExamPaper> CreatedExamPapers { get; set; } = new List<ExamPaper>();
    public virtual ICollection<ExamSession> ExamSessions { get; set; } = new List<ExamSession>();
    public virtual ICollection<ExamResult> ExamResults { get; set; } = new List<ExamResult>();
}
