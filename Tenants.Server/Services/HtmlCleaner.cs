using System.Text.RegularExpressions;

namespace Tenants.Server.Services;

/// <summary>
/// Cleans and reduces HTML size before storing in the database.
/// </summary>
public static class HtmlCleaner
{
    private static readonly Regex CommentRegex = new(@"<!--[\s\S]*?-->", RegexOptions.Compiled);
    private static readonly Regex ScriptRegex = new(@"<script\b[^>]*>[\s\S]*?</script>", RegexOptions.Compiled | RegexOptions.IgnoreCase);
    private static readonly Regex LoaderContainerRegex = new(@"<div\s+id=""loader-container""[^>]*>[\s\S]*?</div>\s*", RegexOptions.Compiled | RegexOptions.IgnoreCase);
    private static readonly Regex DataImageRegex = new(@"data:image/[^;]+;base64,[A-Za-z0-9+/=]+", RegexOptions.Compiled);
    private static readonly Regex WhitespaceBetweenTagsRegex = new(@">\s+<", RegexOptions.Compiled);
    private static readonly Regex MultipleSpacesRegex = new(@"[ \t]+", RegexOptions.Compiled);
    private static readonly Regex NewlinesRegex = new(@"\s*\n\s*", RegexOptions.Compiled);

    /// <summary>
    /// Placeholder for stripped base64 images (1x1 transparent GIF - minimal size).
    /// </summary>
    private const string ImagePlaceholder = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

    /// <summary>
    /// Cleans HTML by removing comments, scripts, base64 images, and collapsing whitespace to reduce storage size.
    /// Preserves structure and inline styles needed for bill display.
    /// Base64 images (QR codes, meter images) are replaced with a tiny placeholder to avoid pipe/DB size limits.
    /// </summary>
    public static string Clean(string html)
    {
        if (string.IsNullOrWhiteSpace(html)) return html;

        var result = html;

        // Remove LESCO/SNGPL loader (relies on JS to hide; we display static HTML)
        result = LoaderContainerRegex.Replace(result, string.Empty);

        // Replace base64 images with a tiny placeholder (before other processing).
        // LESCO bills contain large inline images (QR codes, meter display) that can be 100KB-500KB each.
        // These cause: process pipe buffer overflow, JSON size issues, and DB bloat.
        result = DataImageRegex.Replace(result, ImagePlaceholder);

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
