namespace OnlineExamSystem.Models;

public class ExamQuestion
{
    public int Id { get; set; }
    public int ExamPaperId { get; set; }
    public int QuestionId { get; set; }
    public int QuestionOrder { get; set; }
    public int Score { get; set; }

    public virtual ExamPaper? ExamPaper { get; set; }
    public virtual Question? Question { get; set; }
}
