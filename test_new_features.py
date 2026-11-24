import asyncio
import httpx

async def main():
    base = "http://127.0.0.1:8000"
    async with httpx.AsyncClient(base_url=base) as client:
        # 1. Dev login Director
        r = await client.post("/api/auth/dev-login", json={
            "telegram_id": 1477103854,
            "username": "oqyolai",
            "first_name": "Abdulaziz",
            "last_name": "Kamolov"
        })
        assert r.status_code == 200
        admin_token = r.json()["access_token"]
        admin_headers = {"Authorization": f"Bearer {admin_token}"}
        director = r.json()["user"]
        print("1. Director Login OK:", director["username"])

        # 2. Check founder quest
        r = await client.get("/api/users/founder-quest", headers=admin_headers)
        assert r.status_code == 200, f"Quest failed: {r.text}"
        quest = r.json()
        print("2. Founder Quest OK, is_eligible:", quest.get("is_eligible"))

        # Claim as Director
        r = await client.post("/api/users/founder-quest/claim", headers=admin_headers)
        assert r.status_code == 200, f"Claim failed: {r.text}"
        print("Claim OK:", r.json()["message"])

        # 3. Create a test recipient user
        r = await client.post("/api/auth/dev-login", json={
            "telegram_id": 777666555,
            "username": "shoxrux_test",
            "first_name": "Shoxrux",
            "last_name": "Singer"
        })
        assert r.status_code == 200
        user2 = r.json()["user"]
        user2_token = r.json()["access_token"]
        user2_headers = {"Authorization": f"Bearer {user2_token}"}
        print(f"3. Test User 2 created: ID {user2['id']} (@{user2['username']})")

        # 4. Calling flow: Director calls User 2
        r = await client.post("/api/chats/call/start", headers=admin_headers, json={
            "recipient_id": user2["id"],
            "call_type": "video"
        })
        assert r.status_code == 200, f"Call start failed: {r.text}"
        call_id = r.json()["call_id"]
        print(f"4. Call started: ID {call_id}, status: {r.json()['call_status']}")

        # 5. User 2 checks incoming calls
        r = await client.get("/api/chats/call/incoming", headers=user2_headers)
        assert r.status_code == 200
        inc = r.json()
        assert inc["has_incoming"] is True
        print(f"5. User 2 incoming call detected from @{inc['caller']['username']}")

        # 6. User 2 accepts call
        r = await client.post("/api/chats/call/accept", headers=user2_headers, json={
            "call_id": call_id
        })
        assert r.status_code == 200
        print("6. Call accepted by User 2!")

        # 7. Check status of call
        r = await client.get(f"/api/chats/call/{call_id}/status", headers=admin_headers)
        assert r.status_code == 200
        assert r.json()["status"] == "accepted"
        print("7. Caller verified call status is accepted!")

        # 8. End call
        r = await client.post("/api/chats/call/end", headers=admin_headers, json={
            "call_id": call_id,
            "duration_seconds": 15
        })
        assert r.status_code == 200
        print("8. Call ended successfully!")

        # 9. Admin Overview statistics check
        r = await client.get("/api/admin/overview", headers=admin_headers)
        assert r.status_code == 200
        kpi = r.json()["kpi"]
        print("9. Admin Overview Stats:")
        print(f"   - Online Now: {kpi.get('online_now')}")
        print(f"   - Active Today: {kpi.get('active_today')}")
        print(f"   - New Users Today: {kpi.get('new_users_today')}")
        print(f"   - Total Registered: {kpi.get('total_users')}")
        assert "online_now" in kpi and "active_today" in kpi

        # 10. Gift username for free without payment
        r = await client.post("/api/admin/usernames/gift", headers=admin_headers, json={
            "target_user_id": user2["id"],
            "gifted_username": "sheralijuraev"
        })
        assert r.status_code == 200, f"Gift failed: {r.text}"
        gift_res = r.json()
        print("10. Gift Free Username Result:", gift_res["message"])
        assert gift_res["recipient"]["username"] == "sheralijuraev"

        print("\nALL 10 TESTS PASSED WITH 100% SUCCESS! 🚀")

if __name__ == "__main__":
    asyncio.run(main())
