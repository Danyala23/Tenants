using System.Diagnostics;
using System.Text.Json;
using Tenants.Server.Data;

namespace Tenants.Server.Services;

/// <summary>
/// Runs Python scraper scripts as subprocesses and parses their JSON output.
/// </summary>
public class PythonScriptRunner
{
    private readonly IConfiguration _config;
    private readonly ILogger<PythonScriptRunner> _logger;

    public PythonScriptRunner(IConfiguration config, ILogger<PythonScriptRunner> logger)
    {
        _config = config;
        _logger = logger;
    }

    /// <summary>
    /// Runs a Python script and returns the parsed ScrapedBillResult, or null on failure.
    /// </summary>
    public async Task<ScrapedBillResult?> RunAsync(string scriptName, string[] args, CancellationToken ct = default)
    {
        var pythonPath = _config["Scraping:PythonPath"];
        if (string.IsNullOrWhiteSpace(pythonPath))
        {
            pythonPath = FindPythonExecutable();
        }

        var baseDir = AppContext.BaseDirectory;
        var scriptPath = Path.Combine(baseDir, "Scripts", scriptName);
        if (!File.Exists(scriptPath))
        {
            _logger.LogWarning("Python script not found at {Path}", scriptPath);
            return null;
        }

        var tesseractPath = _config["Scraping:TesseractPath"];
        using var process = new Process
        {
            StartInfo = new ProcessStartInfo
            {
                FileName = pythonPath,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true,
                WorkingDirectory = Path.GetDirectoryName(scriptPath) ?? baseDir,
            }
        };
        if (!string.IsNullOrWhiteSpace(tesseractPath) && File.Exists(tesseractPath))
            process.StartInfo.Environment["TESSERACT_CMD"] = tesseractPath;
        if (scriptName.Equals("lesco_scraper.py", StringComparison.OrdinalIgnoreCase))
            process.StartInfo.Environment["LESCO_DEBUG_HTML"] = Path.Combine(baseDir, "Scripts", "lesco_debug.html");
        if (scriptName.Equals("sngpl_scraper.py", StringComparison.OrdinalIgnoreCase))
            process.StartInfo.Environment["SNGPL_DEBUG_HTML"] = Path.Combine(baseDir, "Scripts", "sngpl_debug.html");
        foreach (var a in args.Prepend(scriptPath))
            process.StartInfo.ArgumentList.Add(a);

        process.Start();
        var stdoutTask = process.StandardOutput.ReadToEndAsync(ct);
        var stderrTask = process.StandardError.ReadToEndAsync(ct);
        await process.WaitForExitAsync(ct);

        var stderr = await stderrTask;
        if (!string.IsNullOrWhiteSpace(stderr))
        {
            _logger.LogWarning("Python script stderr: {Stderr}", stderr.Trim());
        }

        if (process.ExitCode != 0)
        {
            _logger.LogWarning("Python script exited with code {Code}", process.ExitCode);
            return null;
        }

        var stdout = await stdoutTask;
        if (string.IsNullOrWhiteSpace(stdout))
        {
            _logger.LogWarning("Python script produced no output");
            return null;
        }

        try
        {
            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
            var output = JsonSerializer.Deserialize<PythonScraperOutput>(stdout, options);
            if (output == null || output.Amount <= 0)
                return null;

            DateTime? dueDate = null;
            if (!string.IsNullOrWhiteSpace(output.DueDate) && DateTime.TryParse(output.DueDate, out var dt))
                dueDate = dt;

            return new ScrapedBillResult(
                output.Amount,
                dueDate,
                output.Units,
                output.Year,
                output.Month,
                output.Html ?? "");
        }
        catch (JsonException ex)
        {
            _logger.LogWarning(ex, "Failed to parse Python script JSON output");
            return null;
        }
    }

    private static string FindPythonExecutable()
    {
        var candidates = new[] { "python3", "python" };
        foreach (var name in candidates)
        {
            try
            {
                using var p = new Process
                {
                    StartInfo = new ProcessStartInfo
                    {
                        FileName = name,
                        Arguments = "--version",
                        RedirectStandardOutput = true,
                        RedirectStandardError = true,
                        UseShellExecute = false,
                        CreateNoWindow = true,
                    }
                };
                p.Start();
                p.WaitForExit(2000);
                if (p.ExitCode == 0)
                    return name;
            }
            catch
            {
                // ignore, try next
            }
        }
        return "python";
    }

    private sealed record PythonScraperOutput(
        decimal Amount,
        string? DueDate,
        decimal? Units,
        int Year,
        int Month,
        string? Html
    );
}
