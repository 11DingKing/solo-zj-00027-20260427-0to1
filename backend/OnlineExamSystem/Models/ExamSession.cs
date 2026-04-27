namespace OnlineExamSystem.Models;

public enum ExamSessionStatus
{
    IN_PROGRESS,
    SUBMITTED,
    TIMED_OUT
}

public class ExamSession
{
    public int Id { get; set; }
    public int ExamPaperId { get; set; }
    public int StudentId { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime? EndTime { get; set; }
    public ExamSessionStatus Status { get; set; } = ExamSessionStatus.IN_PROGRESS;
    public int ScreenSwitchCount { get; set; } = 0;

    public virtual ExamPaper? ExamPaper { get; set; }
    public virtual User? Student { get; set; }
    public virtual ICollection<ExamAnswer> ExamAnswers { get; set; } = new List<ExamAnswer>();
    public virtual ExamResult? ExamResult { get; set; }
}
