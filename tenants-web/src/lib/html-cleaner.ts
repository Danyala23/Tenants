/** Cleans bill HTML before storing (ported from Tenants.Server/Services/HtmlCleaner.cs) */

const IMAGE_PLACEHOLDER =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

export function cleanBillHtml(html: string): string {
  if (!html?.trim()) return html;

  let result = html;
  result = result.replace(
    /<div\s+id="loader-container"[^>]*>[\s\S]*?<\/div>\s*/gi,
    ""
  );
  result = result.replace(/data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/g, IMAGE_PLACEHOLDER);
  result = result.replace(/<!--[\s\S]*?-->/g, "");
  result = result.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
  result = result.replace(/>\s+</g, "><");
  result = result.replace(/[ \t]+/g, " ");
  result = result.replace(/\s*\n\s*/g, " ");
  return result.trim();
}

export function injectBillViewerScript(html: string): string {
  const script = `<script>
function showTab(index){
  var tabs=document.querySelectorAll('.tab'),contents=document.querySelectorAll('.tab-content');
  tabs.forEach(function(t,i){t.classList.toggle('active',i===index);});
  contents.forEach(function(c,i){c.classList.toggle('active',i===index);});
}
var loader=document.getElementById('loader-container');
if(loader)loader.style.display='none';
</script>`;
  const idx = html.search(/<\/body>/i);
  return idx >= 0 ? html.slice(0, idx) + script + html.slice(idx) : html + script;
}
