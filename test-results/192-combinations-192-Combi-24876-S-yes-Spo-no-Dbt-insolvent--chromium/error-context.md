# Page snapshot

```yaml
- generic [ref=e2]:
  - region "Notifications (F8)":
    - list
  - region "Notifications alt+T"
  - generic [ref=e3]:
    - button "Cancel & Exit" [ref=e4] [cursor=pointer]
    - generic [ref=e5]:
      - generic [ref=e19]:
        - generic [ref=e20]:
          - img [ref=e22]
          - heading "Key Assets" [level=2] [ref=e24]
          - paragraph [ref=e25]: Search for the primary banks or institutions involved.
        - generic [ref=e26]:
          - generic [ref=e28]:
            - generic [ref=e29]:
              - generic [ref=e30]: Institution
              - generic [ref=e32]:
                - textbox "Type institution name (e.g. Fidelity, Chase)..." [ref=e33]: Chase Bank
                - img [ref=e35]
            - generic [ref=e39]:
              - generic [ref=e40]: Type
              - combobox [ref=e41] [cursor=pointer]:
                - generic: Bank Account
                - img [ref=e42]
          - button "Add Another Asset" [ref=e44] [cursor=pointer]:
            - img
            - text: Add Another Asset
        - button "Saving..." [disabled]
      - generic [ref=e45]:
        - button "Back" [ref=e46] [cursor=pointer]
        - paragraph [ref=e47]: Step 7 of 9
  - button [ref=e50] [cursor=pointer]:
    - img
```