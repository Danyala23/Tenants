using System.Text.RegularExpressions;

namespace Tenants.Server.Services;

/// <summary>
/// Cleans and reduces HTML size before storing in the database.
/// </summary>
public static class HtmlCleaner
{
    private static readonly Regex CommentRegex = new(@"<!--[\s\S]*?-->", RegexOptions.Compiled);
    private static readonly Regex ScriptRegex = new(@"<script\b[^>]*>[\s\S]*?</script>", RegexOptions.Compiled | RegexOptions.IgnoreCase);
    private static readonly Regex WhitespaceBetweenTagsRegex = new(@">\s+<", RegexOptions.Compiled);
    private static readonly Regex MultipleSpacesRegex = new(@"[ \t]+", RegexOptions.Compiled);
    private static readonly Regex NewlinesRegex = new(@"\s*\n\s*", RegexOptions.Compiled);

    /// <summary>
    /// Cleans HTML by removing comments, scripts, and collapsing whitespace to reduce storage size.
    /// Preserves structure and inline styles needed for bill display.
    /// </summary>
    public static string Clean(string html)
    {
        if (string.IsNullOrWhiteSpace(html)) return html;

        var result = html;

        // Remove HTML comments
        result = CommentRegex.Replace(result, string.Empty);

        // Remove script blocks (analytics, tracking, etc. - not needed for static bill view)
        result = ScriptRegex.Replace(result, string.Empty);

        // Collapse whitespace between tags (e.g. ">\n  \n<" -> "><")
        result = WhitespaceBetweenTagsRegex.Replace(result, "><");

        // Collapse multiple spaces/tabs to single space
        result = MultipleSpacesRegex.Replace(result, " ");

        // Collapse newlines and surrounding whitespace to single space
        result = NewlinesRegex.Replace(result, " ");

        return result.Trim();
    }
}
