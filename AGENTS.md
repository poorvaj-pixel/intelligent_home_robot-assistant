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

- Robot tasks are generator scripts in src/robot/TaskRunner.tsx driven per frame; STOP drops the script — keeps tasks interruptible and sequential.
- Navigation (src/robot/navigation.ts) inflates walls, closed doors, open door leaves and furniture by the robot radius; all motion is sub-stepped and checked — prevents passing through obstacles.
