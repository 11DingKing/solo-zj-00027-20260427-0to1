using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OnlineExamSystem.DTOs;
using OnlineExamSystem.Models;
using OnlineExamSystem.Services;

namespace OnlineExamSystem.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(IAuthService authService, ILogger<AuthController> logger)
    {
        _authService = authService;
        _logger = logger;
    }

    [HttpPost("login")]
    public async Task<ActionResult<LoginResponse>> Login([FromBody] LoginRequest request)
    {
        try
        {
            _logger.LogInformation("Login attempt for username: {Username}", request.Username);
            
            var result = await _authService.LoginAsync(request);
            if (result == null)
            {
                _logger.LogWarning("Login failed for username: {Username} - invalid credentials", request.Username);
                return Unauthorized(new { message = "用户名或密码错误" });
            }
            
            _logger.LogInformation("Login successful for username: {Username}", request.Username);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Login error for username: {Username}", request.Username);
            return StatusCode(500, new { message = "服务器内部错误，请稍后重试" });
        }
    }

    [HttpPost("register")]
    public async Task<ActionResult<UserDTO>> Register([FromBody] RegisterRequest request)
    {
        try
        {
            var result = await _authService.RegisterAsync(request);
            if (result == null)
            {
                return BadRequest(new { message = "用户名已存在" });
            }
            return CreatedAtAction(nameof(GetCurrentUser), new { id = result.Id }, result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Register error for username: {Username}", request.Username);
            return StatusCode(500, new { message = "服务器内部错误，请稍后重试" });
        }
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<UserDTO>> GetCurrentUser()
    {
        try
        {
            var user = await _authService.GetCurrentUserAsync(User);
            if (user == null)
            {
                return Unauthorized();
            }
            return Ok(user);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "GetCurrentUser error");
            return StatusCode(500, new { message = "服务器内部错误，请稍后重试" });
        }
    }
}
