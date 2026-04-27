namespace OnlineExamSystem.Models;

public class ExamPaper
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int TotalScore { get; set; }
    public int PassingScore { get; set; }
    public int Duration { get; set; }
    public bool ShuffleQuestions { get; set; }
    public bool ShuffleOptions { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public int CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public virtual User? Creator { get; set; }
    public virtual ICollection<ExamQuestion> ExamQuestions { get; set; } = new List<ExamQuestion>();
    public virtual ICollection<ExamSession> ExamSessions { get; set; } = new List<ExamSession>();
    public virtual ICollection<ExamResult> ExamResults { get; set; } = new List<ExamResult>();
}
