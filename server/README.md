test create-room
```
curl -X POST "http://localhost:5000/api/create-meeting" \
-H "Content-Type: application/json" \
-d '{"username": "random_username", "meeting_name": "random_meeting_name"}'
```