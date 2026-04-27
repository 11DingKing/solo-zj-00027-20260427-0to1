using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using OnlineExamSystem.Data;
using OnlineExamSystem.Models;
using Newtonsoft.Json;

namespace OnlineExamSystem.Services;

public static class SeedData
{
    public static async Task InitializeAsync(
        AppDbContext context,
        UserManager<User> userManager,
        RoleManager<IdentityRole<int>> roleManager)
    {
        await CreateRolesAsync(roleManager);
        
        var teacher = await CreateTeacherAsync(userManager);
        var students = await CreateStudentsAsync(userManager);
        
        if (!await context.Questions.AnyAsync())
        {
            await CreateQuestionsAsync(context, teacher);
        }
        
        if (!await context.ExamPapers.AnyAsync())
        {
            await CreateExamPaperAsync(context, teacher);
        }
    }

    private static async Task CreateRolesAsync(RoleManager<IdentityRole<int>> roleManager)
    {
        var roles = new[] { "TEACHER", "STUDENT" };
        
        foreach (var role in roles)
        {
            if (!await roleManager.RoleExistsAsync(role))
            {
                await roleManager.CreateAsync(new IdentityRole<int>(role));
            }
        }
    }

    private static async Task<User> CreateTeacherAsync(UserManager<User> userManager)
    {
        var teacher = await userManager.FindByNameAsync("teacher");
        if (teacher != null) return teacher;
        
        teacher = new User
        {
            UserName = "teacher",
            Name = "张老师",
            Role = UserRole.TEACHER,
            CreatedAt = DateTime.UtcNow
        };
        
        var result = await userManager.CreateAsync(teacher, "teacher123");
        if (result.Succeeded)
        {
            await userManager.AddToRoleAsync(teacher, "TEACHER");
        }
        
        return teacher;
    }

    private static async Task<List<User>> CreateStudentsAsync(UserManager<User> userManager)
    {
        var students = new List<User>();
        var studentNames = new[] 
        { 
            ("student1", "李小明"), 
            ("student2", "王小红"), 
            ("student3", "张小华"),
            ("student4", "刘小丽"),
            ("student5", "陈小强")
        };
        
        foreach (var (username, name) in studentNames)
        {
            var student = await userManager.FindByNameAsync(username);
            if (student == null)
            {
                student = new User
                {
                    UserName = username,
                    Name = name,
                    Role = UserRole.STUDENT,
                    CreatedAt = DateTime.UtcNow
                };
                
                var result = await userManager.CreateAsync(student, "student123");
                if (result.Succeeded)
                {
                    await userManager.AddToRoleAsync(student, "STUDENT");
                }
            }
            students.Add(student!);
        }
        
        return students;
    }

    private static async Task CreateQuestionsAsync(AppDbContext context, User teacher)
    {
        var now = DateTime.UtcNow;
        
        var questions = new List<Question>
        {
            new()
            {
                Type = QuestionType.SINGLE_CHOICE,
                Content = "C# 中，以下哪个是值类型？",
                CorrectAnswer = "A",
                Score = 5,
                Difficulty = DifficultyLevel.EASY,
                Tags = new[] { "C#", "值类型", "基础" },
                CreatedAt = now,
                Options = new List<QuestionOption>
                {
                    new() { Text = "A. int", IsCorrect = true, OptionOrder = 1 },
                    new() { Text = "B. string", IsCorrect = false, OptionOrder = 2 },
                    new() { Text = "C. object", IsCorrect = false, OptionOrder = 3 },
                    new() { Text = "D. class", IsCorrect = false, OptionOrder = 4 }
                }
            },
            new()
            {
                Type = QuestionType.SINGLE_CHOICE,
                Content = "ASP.NET Core 中，用于依赖注入的服务生命周期有几种？",
                CorrectAnswer = "C",
                Score = 5,
                Difficulty = DifficultyLevel.MEDIUM,
                Tags = new[] { "ASP.NET Core", "依赖注入", "中间件" },
                CreatedAt = now,
                Options = new List<QuestionOption>
                {
                    new() { Text = "A. 2种", IsCorrect = false, OptionOrder = 1 },
                    new() { Text = "B. 4种", IsCorrect = false, OptionOrder = 2 },
                    new() { Text = "C. 3种", IsCorrect = true, OptionOrder = 3 },
                    new() { Text = "D. 5种", IsCorrect = false, OptionOrder = 4 }
                }
            },
            new()
            {
                Type = QuestionType.MULTIPLE_CHOICE,
                Content = "以下哪些是 React 的生命周期方法？",
                CorrectAnswer = JsonConvert.SerializeObject(new[] { "A", "B", "C" }),
                Score = 10,
                Difficulty = DifficultyLevel.MEDIUM,
                Tags = new[] { "React", "生命周期", "前端" },
                CreatedAt = now,
                Options = new List<QuestionOption>
                {
                    new() { Text = "A. componentDidMount", IsCorrect = true, OptionOrder = 1 },
                    new() { Text = "B. componentDidUpdate", IsCorrect = true, OptionOrder = 2 },
                    new() { Text = "C. componentWillUnmount", IsCorrect = true, OptionOrder = 3 },
                    new() { Text = "D. useEffect", IsCorrect = false, OptionOrder = 4 }
                }
            },
            new()
            {
                Type = QuestionType.MULTIPLE_CHOICE,
                Content = "以下哪些是 PostgreSQL 的数据类型？",
                CorrectAnswer = JsonConvert.SerializeObject(new[] { "A", "B", "D" }),
                Score = 10,
                Difficulty = DifficultyLevel.EASY,
                Tags = new[] { "PostgreSQL", "数据库", "数据类型" },
                CreatedAt = now,
                Options = new List<QuestionOption>
                {
                    new() { Text = "A. INTEGER", IsCorrect = true, OptionOrder = 1 },
                    new() { Text = "B. VARCHAR", IsCorrect = true, OptionOrder = 2 },
                    new() { Text = "C. NVARCHAR", IsCorrect = false, OptionOrder = 3 },
                    new() { Text = "D. TEXT", IsCorrect = true, OptionOrder = 4 }
                }
            },
            new()
            {
                Type = QuestionType.TRUE_FALSE,
                Content = "在 C# 中，string 是引用类型，但具有值类型的行为特性。",
                CorrectAnswer = "true",
                Score = 5,
                Difficulty = DifficultyLevel.EASY,
                Tags = new[] { "C#", "字符串", "基础" },
                CreatedAt = now,
                Options = new List<QuestionOption>
                {
                    new() { Text = "A. 正确", IsCorrect = true, OptionOrder = 1 },
                    new() { Text = "B. 错误", IsCorrect = false, OptionOrder = 2 }
                }
            },
            new()
            {
                Type = QuestionType.TRUE_FALSE,
                Content = "ASP.NET Core 中，Middleware 是按注册顺序执行的。",
                CorrectAnswer = "true",
                Score = 5,
                Difficulty = DifficultyLevel.MEDIUM,
                Tags = new[] { "ASP.NET Core", "中间件", "管道" },
                CreatedAt = now,
                Options = new List<QuestionOption>
                {
                    new() { Text = "A. 正确", IsCorrect = true, OptionOrder = 1 },
                    new() { Text = "B. 错误", IsCorrect = false, OptionOrder = 2 }
                }
            },
            new()
            {
                Type = QuestionType.FILL_BLANK,
                Content = "在 React 中，用于管理组件状态的 Hook 是 ______。",
                CorrectAnswer = "useState",
                Score = 10,
                Difficulty = DifficultyLevel.EASY,
                Tags = new[] { "React", "Hooks", "状态" },
                CreatedAt = now
            },
            new()
            {
                Type = QuestionType.FILL_BLANK,
                Content = "Entity Framework Core 中，用于执行数据库迁移的命令是 dotnet ef ______。",
                CorrectAnswer = "migrations",
                Score = 10,
                Difficulty = DifficultyLevel.MEDIUM,
                Tags = new[] { "EF Core", "数据库", "迁移" },
                CreatedAt = now
            },
            new()
            {
                Type = QuestionType.SINGLE_CHOICE,
                Content = "以下哪个不是 RESTful API 的 HTTP 方法？",
                CorrectAnswer = "D",
                Score = 5,
                Difficulty = DifficultyLevel.EASY,
                Tags = new[] { "RESTful", "HTTP", "API" },
                CreatedAt = now,
                Options = new List<QuestionOption>
                {
                    new() { Text = "A. GET", IsCorrect = false, OptionOrder = 1 },
                    new() { Text = "B. POST", IsCorrect = false, OptionOrder = 2 },
                    new() { Text = "C. DELETE", IsCorrect = false, OptionOrder = 3 },
                    new() { Text = "D. SEND", IsCorrect = true, OptionOrder = 4 }
                }
            },
            new()
            {
                Type = QuestionType.SINGLE_CHOICE,
                Content = "TypeScript 中，用于定义可选属性的符号是？",
                CorrectAnswer = "B",
                Score = 5,
                Difficulty = DifficultyLevel.EASY,
                Tags = new[] { "TypeScript", "类型", "前端" },
                CreatedAt = now,
                Options = new List<QuestionOption>
                {
                    new() { Text = "A. !", IsCorrect = false, OptionOrder = 1 },
                    new() { Text = "B. ?", IsCorrect = true, OptionOrder = 2 },
                    new() { Text = "C. *", IsCorrect = false, OptionOrder = 3 },
                    new() { Text = "D. &", IsCorrect = false, OptionOrder = 4 }
                }
            },
            new()
            {
                Type = QuestionType.MULTIPLE_CHOICE,
                Content = "以下哪些是 .NET 8 的新特性？",
                CorrectAnswer = JsonConvert.SerializeObject(new[] { "A", "B", "C" }),
                Score = 10,
                Difficulty = DifficultyLevel.HARD,
                Tags = new[] { ".NET", "C#", "新版本" },
                CreatedAt = now,
                Options = new List<QuestionOption>
                {
                    new() { Text = "A. 原生 AOT", IsCorrect = true, OptionOrder = 1 },
                    new() { Text = "B. 容器性能改进", IsCorrect = true, OptionOrder = 2 },
                    new() { Text = "C. Blazor 增强", IsCorrect = true, OptionOrder = 3 },
                    new() { Text = "D. Web Forms 回归", IsCorrect = false, OptionOrder = 4 }
                }
            },
            new()
            {
                Type = QuestionType.TRUE_FALSE,
                Content = "Docker 容器是完全隔离的，无法访问宿主机的任何资源。",
                CorrectAnswer = "false",
                Score = 5,
                Difficulty = DifficultyLevel.MEDIUM,
                Tags = new[] { "Docker", "容器", "虚拟化" },
                CreatedAt = now,
                Options = new List<QuestionOption>
                {
                    new() { Text = "A. 正确", IsCorrect = false, OptionOrder = 1 },
                    new() { Text = "B. 错误", IsCorrect = true, OptionOrder = 2 }
                }
            },
            new()
            {
                Type = QuestionType.FILL_BLANK,
                Content = "JWT 的全称是 ______ Web Token。",
                CorrectAnswer = "JSON",
                Score = 10,
                Difficulty = DifficultyLevel.EASY,
                Tags = new[] { "JWT", "认证", "安全" },
                CreatedAt = now
            },
            new()
            {
                Type = QuestionType.SINGLE_CHOICE,
                Content = "PostgreSQL 中，用于自增主键的数据类型是？",
                CorrectAnswer = "B",
                Score = 5,
                Difficulty = DifficultyLevel.EASY,
                Tags = new[] { "PostgreSQL", "数据库", "主键" },
                CreatedAt = now,
                Options = new List<QuestionOption>
                {
                    new() { Text = "A. AUTO_INCREMENT", IsCorrect = false, OptionOrder = 1 },
                    new() { Text = "B. SERIAL", IsCorrect = true, OptionOrder = 2 },
                    new() { Text = "C. IDENTITY", IsCorrect = false, OptionOrder = 3 },
                    new() { Text = "D. ROWID", IsCorrect = false, OptionOrder = 4 }
                }
            },
            new()
            {
                Type = QuestionType.SINGLE_CHOICE,
                Content = "以下哪个设计模式属于创建型模式？",
                CorrectAnswer = "A",
                Score = 5,
                Difficulty = DifficultyLevel.MEDIUM,
                Tags = new[] { "设计模式", "架构", "基础" },
                CreatedAt = now,
                Options = new List<QuestionOption>
                {
                    new() { Text = "A. 单例模式", IsCorrect = true, OptionOrder = 1 },
                    new() { Text = "B. 适配器模式", IsCorrect = false, OptionOrder = 2 },
                    new() { Text = "C. 观察者模式", IsCorrect = false, OptionOrder = 3 },
                    new() { Text = "D. 策略模式", IsCorrect = false, OptionOrder = 4 }
                }
            }
        };
        
        foreach (var question in questions)
        {
            foreach (var option in question.Options)
            {
                option.Question = question;
            }
        }
        
        context.Questions.AddRange(questions);
        await context.SaveChangesAsync();
    }

    private static async Task CreateExamPaperAsync(AppDbContext context, User teacher)
    {
        var questions = await context.Questions.ToListAsync();
        
        var examPaper = new ExamPaper
        {
            Name = "软件技术基础测试",
            Description = "这是一份关于 C#、React、PostgreSQL 等技术的综合测试",
            TotalScore = 100,
            PassingScore = 60,
            Duration = 60,
            ShuffleQuestions = false,
            ShuffleOptions = false,
            StartTime = DateTime.UtcNow.AddDays(-1),
            EndTime = DateTime.UtcNow.AddDays(30),
            CreatedBy = teacher.Id,
            CreatedAt = DateTime.UtcNow
        };
        
        context.ExamPapers.Add(examPaper);
        await context.SaveChangesAsync();
        
        var order = 1;
        var examQuestions = new List<ExamQuestion>();
        
        foreach (var question in questions.Take(10))
        {
            examQuestions.Add(new ExamQuestion
            {
                ExamPaperId = examPaper.Id,
                QuestionId = question.Id,
                QuestionOrder = order++
            });
        }
        
        context.ExamQuestions.AddRange(examQuestions);
        await context.SaveChangesAsync();
    }
}
