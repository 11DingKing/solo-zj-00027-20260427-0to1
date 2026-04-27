namespace OnlineExamSystem.Models;

public class QuestionOption
{
    public int Id { get; set; }
    public int QuestionId { get; set; }
    public string Text { get; set; } = string.Empty;
    public bool? IsCorrect { get; set; }
    public int OptionOrder { get; set; }

    public virtual Question? Question { get; set; }
}
