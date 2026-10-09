<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Data access goes through the browser Supabase client with RLS + DB triggers enforcing deadlines/like rules (src/lib/data.ts); why: rules must hold even if UI is bypassed.
- Sketch images live in a private storage bucket and are shown via signed URLs; why: workspace blocks public buckets.
