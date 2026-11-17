# About this fork

This fork of [Paradigm-Study/claude-share](https://github.com/Paradigm-Study/claude-share) is pinned to upstream 0.11.53 (commit 9d88f99). It adds two fixes, both reported upstream:

- **Windows hosts:** a guest's reads inside the project run without asking. Paths like `C:\...` are now recognized ([#89](https://github.com/Paradigm-Study/claude-share/issues/89)).
- **Room place saved while live:** the place is saved every 30 s, not only at close. A host or guest whose session is killed (Claude Desktop quit on Windows, a crash) takes the same room back when the conversation reopens ([#90](https://github.com/Paradigm-Study/claude-share/issues/90)).

Updates and the "is out" commands point to this fork, so turning on Updates never pulls an unpatched upstream release. Install:

```
claude plugin marketplace add ecerutti/claude-share
claude plugin install shared-session@claude-share
```

Rooms still go through the upstream public server unless you set your own (`server` option).
