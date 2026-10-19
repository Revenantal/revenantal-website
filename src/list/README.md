# Directory

Owns the responsive List view, source-age labels and clipboard feedback. It imports shared data only and receives freshness-filtered data through props.

ListView renders projects, server summaries, public profile buttons and collapsible shared credits. CopyButton retains selectable text when clipboard access fails. SourceAge labels observation time independently of the aggregate snapshot write time.

Keep channel behavior out of this folder. Add content through the shared pipeline, with semantic markup, visible keyboard focus and mobile layout checks.
