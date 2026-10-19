# TV Controls

Owns browser input and lifecycle listeners. page-clock.ts currently refreshes the shared clock every twenty seconds and immediately on tab resume, returning complete cleanup. App supplies the store action.

The cabinet, dial and other controls follow in phase 2. Keep global listeners in this layer and route user actions through the shared store.
