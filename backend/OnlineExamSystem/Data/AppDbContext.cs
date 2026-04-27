using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using OnlineExamSystem.Models;

namespace OnlineExamSystem.Data;

public class AppDbContext : IdentityDbContext<User, IdentityRole<int>, int>
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public DbSet<Question> Questions { get; set; }
    public DbSet<QuestionOption> QuestionOptions { get; set; }
    public DbSet<ExamPaper> ExamPapers { get; set; }
    public DbSet<ExamQuestion> ExamQuestions { get; set; }
    public DbSet<ExamSession> ExamSessions { get; set; }
    public DbSet<ExamAnswer> ExamAnswers { get; set; }
    public DbSet<ExamResult> ExamResults { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>(entity =>
        {
            entity.Property(u => u.Name)
                .IsRequired()
                .HasMaxLength(100);

            entity.Property(u => u.Role)
                .HasConversion<string>()
                .IsRequired();
        });

        modelBuilder.Entity<Question>(entity =>
        {
            entity.Property(q => q.Type)
                .HasConversion<string>()
                .IsRequired();

            entity.Property(q => q.Content)
                .IsRequired();

            entity.Property(q => q.CorrectAnswer)
                .IsRequired();

            entity.Property(q => q.Difficulty)
                .HasConversion<string>()
                .IsRequired();

            entity.Property(q => q.Tags)
                .HasColumnType("text[]");
        });

        modelBuilder.Entity<QuestionOption>(entity =>
        {
            entity.Property(o => o.Text)
                .IsRequired();

            entity.HasOne(o => o.Question)
                .WithMany(q => q.Options)
                .HasForeignKey(o => o.QuestionId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ExamPaper>(entity =>
        {
            entity.Property(e => e.Name)
                .IsRequired()
                .HasMaxLength(200);

            entity.Property(e => e.TotalScore)
                .IsRequired();

            entity.Property(e => e.PassingScore)
                .IsRequired();

            entity.Property(e => e.Duration)
                .IsRequired();

            entity.Property(e => e.StartTime)
                .IsRequired();

            entity.Property(e => e.EndTime)
                .IsRequired();

            entity.HasOne(e => e.Creator)
                .WithMany(u => u.CreatedExamPapers)
                .HasForeignKey(e => e.CreatedBy)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<ExamQuestion>(entity =>
        {
            entity.HasOne(eq => eq.ExamPaper)
                .WithMany(ep => ep.ExamQuestions)
                .HasForeignKey(eq => eq.ExamPaperId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(eq => eq.Question)
                .WithMany(q => q.ExamQuestions)
                .HasForeignKey(eq => eq.QuestionId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<ExamSession>(entity =>
        {
            entity.Property(e => e.Status)
                .HasConversion<string>()
                .IsRequired();

            entity.Property(e => e.ScreenSwitchCount)
                .HasDefaultValue(0);

            entity.HasOne(e => e.ExamPaper)
                .WithMany(ep => ep.ExamSessions)
                .HasForeignKey(e => e.ExamPaperId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Student)
                .WithMany(u => u.ExamSessions)
                .HasForeignKey(e => e.StudentId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<ExamAnswer>(entity =>
        {
            entity.Property(e => e.StudentAnswer)
                .IsRequired();

            entity.Property(e => e.AnsweredAt)
                .IsRequired();

            entity.HasOne(e => e.ExamSession)
                .WithMany(s => s.ExamAnswers)
                .HasForeignKey(e => e.ExamSessionId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Question)
                .WithMany(q => q.ExamAnswers)
                .HasForeignKey(e => e.QuestionId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<ExamResult>(entity =>
        {
            entity.Property(e => e.TotalScore)
                .IsRequired();

            entity.Property(e => e.AutoScore)
                .IsRequired();

            entity.Property(e => e.IsPassed)
                .IsRequired();

            entity.Property(e => e.SubmittedAt)
                .IsRequired();

            entity.HasOne(e => e.ExamSession)
                .WithOne(s => s.ExamResult)
                .HasForeignKey<ExamResult>(e => e.ExamSessionId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Student)
                .WithMany(u => u.ExamResults)
                .HasForeignKey(e => e.StudentId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.ExamPaper)
                .WithMany(ep => ep.ExamResults)
                .HasForeignKey(e => e.ExamPaperId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }
}
