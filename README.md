Collaborative Crossword

This is a realtime crossword application built to learn modern webdev.

Goals
- HTML, CSS, JavaScript, React, TypeScript, and Next.js
- Build a crossword interface
- Add real-time collaboration
- Support custom puzzle imports
- Deploy Publicly

Stack
- React
- TypeScript
- Next.js
- Tailwind CSS
- Supabase
- Vercel

Status

Project Setup in progress.

Supabase Development notes
---------------------------
Project currently uses Supabase for leaderboard storage

Leaderboard Table

Table Name: leaderboard_entries

Expected Columns:

id
puzzle_id
mode
player_name
solve_time_ms
used_reveal
completed_at

App stores solve time as milliseconds in solve_time_ms, not as formatted string. Display formatting such as 01:38 is handled in frontend. 


Leaderboard Behavior:

Eligible puzzle completions are saved to Supabase.

A completion is leaderboard eligible only if no reveal was used.

Reveal-used completions still show the completion modal, but they are not inserted into the leaderboard.

The completion modal loads leaderboard entreies from Supabase and highlights the row that was just submitted.

Local Development Shortcuts
---------------------------
Developer keyboard shortcuts are enabled in devtools.js.

Current dev shortcuts:

1 = Lock all white cells
2 = Unlock all white cells
3 = Reveal puzzle grid for development testing
4 = Force an eligible completion for leaderboard testing

Shortcut 4 is intentionally used for local testing of leaderboard inserts. It should not be enabled in production.

Before production, set dev shortcuts to disabled in devtools.js.

Cleaning up test leaderboard rows

During development, repeated testing may create duplicate leaderboard rows.

To delete test rows for a specific player and puzzle, run this in the Supabase SQL Editor:

delete from leaderboard_entries
where player_name = 'Gregg'
and puzzle_id = 'easy001';

To delete only revealed/ineligible rows if any were inserted during testing:

delete from leaderboard_entries
where used_reveal = true;

Use delete queries carefully. Prefer filtering by player_name, puzzle_id, and mode when possible.

Authentication and Profiles
---------------------------

Gameplay requires a signed-in user.

Users must have a profile display name before starting a game.

The profile table is platform-level, not crossword-specific.

The player name field is currently prefilled from the profile display name and acts as a temporary bridge to the existing session system.

Guest play is intentionally not supported.

For local development, email confirmation may be disabled. In production, email confirmation should be enabled and redirect URLs should be configured.


Production Readiness Checklist
------------------------------

Before deploying:

- Dev shortcuts are disabled in devtools.js.
- Supabase Auth is enabled.
- Both test users can sign in.
- Both test users have profile display names.
- Pair rooms can be created and joined.
- Host can start a room.
- Both players load the same puzzle.
- Letters sync between players.
- Shared highlight/focus syncs between players.
- Reveal Letter syncs and marks the room reveal-used.
- Reveal Word syncs and marks the room reveal-used.
- Reveal Puzzle syncs, fills both grids, and marks the room reveal-used.
- Normal completion shows completion modal for both players.
- Reveal-used completion is not leaderboard eligible.
- Eligible completion inserts only one leaderboard row.
- Returning to the lobby refreshes the room list.