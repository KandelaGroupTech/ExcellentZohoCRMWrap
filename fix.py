with open("src/app/(dashboard)/layout.tsx", "r", encoding="utf-8") as f:
    text = f.read()

text = text.replace(
    "Store } from \"lucide-react\"",
    "Store, Columns } from \"lucide-react\""
)
text = text.replace(
    "{ name: \"Pipeline\", href: \"/dashboard\", icon: LayoutDashboard }",
    "{ name: \"Dashboard\", href: \"/dashboard\", icon: LayoutDashboard },\n    { name: \"Pipeline\", href: \"/dashboard/pipeline\", icon: Columns }"
)
text = text.replace(
    "<div className=\"flex h-16 shrink-0 items-center px-6 border-b border-gray-800 font-bold text-lg text-white\">\n          Journey Office Builders\n        </div>",
    "<Link href=\"/dashboard\" className=\"flex h-16 shrink-0 items-center px-6 border-b border-gray-800 font-bold text-lg text-white hover:text-gray-300 transition-colors\">\n          <img src=\"/website-demos/excellentzohocrm/icon.png\" alt=\"Logo\" className=\"w-6 h-6 mr-3 rounded\" />\n          Journey Office Builders\n        </Link>"
)
text = text.replace(
    "<h1 className=\"text-xl font-semibold text-white truncate\">Dashboard</h1>",
    "<Link href=\"/dashboard\" className=\"text-xl font-semibold text-white truncate hover:text-gray-300 transition-colors\">\n            Dashboard\n          </Link>"
)

with open("src/app/(dashboard)/layout.tsx", "w", encoding="utf-8") as f:
    f.write(text)

