namespace OnlineExamSystem.Models;

public class ExamAnswer
{
    public int Id { get; set; }
    public int ExamSessionId { get; set; }
    public int QuestionId { get; set; }
    public string StudentAnswer { get; set; } = string.Empty;
    public bool? IsCorrect { get; set; }
    public int? TeacherScore { get; set; }
    public string? TeacherComment { get; set; }
    public DateTime AnsweredAt { get; set; } = DateTime.UtcNow;

    public virtual ExamSession? ExamSession { get; set; }
    public virtual Question? Question { get; set; }
}
