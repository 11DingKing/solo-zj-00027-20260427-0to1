namespace OnlineExamSystem.Models;

public enum QuestionType
{
    SINGLE_CHOICE,
    MULTIPLE_CHOICE,
    TRUE_FALSE,
    FILL_BLANK
}

public enum DifficultyLevel
{
    EASY,
    MEDIUM,
    HARD
}

public class Question
{
    public int Id { get; set; }
    public QuestionType Type { get; set; }
    public string Content { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public string CorrectAnswer { get; set; } = string.Empty;
    public int Score { get; set; }
    public DifficultyLevel Difficulty { get; set; }
    public string[] Tags { get; set; } = Array.Empty<string>();
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public virtual ICollection<QuestionOption> Options { get; set; } = new List<QuestionOption>();
    public virtual ICollection<ExamQuestion> ExamQuestions { get; set; } = new List<ExamQuestion>();
    public virtual ICollection<ExamAnswer> ExamAnswers { get; set; } = new List<ExamAnswer>();
}
