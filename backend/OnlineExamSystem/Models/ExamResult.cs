namespace OnlineExamSystem.Models;

public class ExamResult
{
    public int Id { get; set; }
    public int ExamSessionId { get; set; }
    public int StudentId { get; set; }
    public int ExamPaperId { get; set; }
    public int TotalScore { get; set; }
    public int AutoScore { get; set; }
    public int? TeacherScore { get; set; }
    public bool IsPassed { get; set; }
    public DateTime SubmittedAt { get; set; }
    public DateTime? GradedAt { get; set; }

    public virtual ExamSession? ExamSession { get; set; }
    public virtual User? Student { get; set; }
    public virtual ExamPaper? ExamPaper { get; set; }
}
