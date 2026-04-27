using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OnlineExamSystem.DTOs;
using OnlineExamSystem.Models;
using OnlineExamSystem.Services;

namespace OnlineExamSystem.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "TEACHER")]
public class QuestionController : ControllerBase
{
    private readonly IQuestionService _questionService;

    public QuestionController(IQuestionService questionService)
    {
        _questionService = questionService;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<QuestionResponse>> GetQuestions(
        [FromQuery] int page = 1,
        [FromQuery] int size = 10,
        [FromQuery] QuestionType? type = null,
        [FromQuery] DifficultyLevel? difficulty = null,
        [FromQuery] string? tags = null)
    {
        var result = await _questionService.GetQuestionsAsync(page, size, type, difficulty, tags);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<QuestionDTO>> GetQuestion(int id)
    {
        var result = await _questionService.GetQuestionByIdAsync(id);
        if (result == null)
        {
            return NotFound();
        }
        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<QuestionDTO>> CreateQuestion([FromBody] CreateQuestionRequest request)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await _questionService.CreateQuestionAsync(request, userId);
        return CreatedAtAction(nameof(GetQuestion), new { id = result.Id }, result);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<QuestionDTO>> UpdateQuestion(int id, [FromBody] UpdateQuestionRequest request)
    {
        var result = await _questionService.UpdateQuestionAsync(id, request);
        if (result == null)
        {
            return NotFound();
        }
        return Ok(result);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteQuestion(int id)
    {
        var result = await _questionService.DeleteQuestionAsync(id);
        if (!result)
        {
            return NotFound();
        }
        return NoContent();
    }

    [HttpGet("tags")]
    [AllowAnonymous]
    public async Task<ActionResult<IEnumerable<string>>> GetAllTags()
    {
        var result = await _questionService.GetAllTagsAsync();
        return Ok(result);
    }
}
