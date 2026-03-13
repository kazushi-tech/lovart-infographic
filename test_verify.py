"""Verification script for eager-strolling-toast plan milestones."""
import sys
import json
from playwright.sync_api import sync_playwright

def main():
    results = {"errors": [], "screenshots": [], "checks": []}

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={"width": 1440, "height": 900},
            locale="ja-JP"
        )
        page = context.new_page()

        # Collect console errors
        console_errors = []
        page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)

        # ---- Step 1: Initial load ----
        page.goto("http://localhost:3000")
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(2000)

        page.screenshot(path="/tmp/v01_initial.png", full_page=True)
        results["screenshots"].append("/tmp/v01_initial.png")

        # Get all visible text to understand state
        body_text = page.locator("body").inner_text()
        print("=== INITIAL STATE ===")
        print(body_text[:500])

        # Count buttons
        buttons = page.locator("button").all()
        print(f"\nButtons: {len(buttons)}")
        for i, b in enumerate(buttons[:10]):
            try:
                txt = b.inner_text()
                vis = b.is_visible()
                print(f"  [{i}] visible={vis} text={txt[:60]}")
            except:
                pass

        # ---- Step 2: Start new project ----
        # Look for the "new creation" button
        new_btn = page.locator("button", has_text="新しく作成")
        if new_btn.count() > 0:
            print("\n=== Clicking '新しく作成' ===")
            new_btn.first.click()
            page.wait_for_timeout(1500)
            page.screenshot(path="/tmp/v02_after_new.png", full_page=True)
            results["screenshots"].append("/tmp/v02_after_new.png")

            body_text = page.locator("body").inner_text()
            print(body_text[:500])

        # ---- Step 3: Check first question (theme input) ----
        # Look for text input or textarea
        inputs = page.locator("input[type='text'], textarea").all()
        print(f"\nText inputs: {len(inputs)}")

        # Look for option buttons (outputTarget selection)
        option_btns = page.locator("[data-option-id], [role='option']").all()
        print(f"Option elements: {len(option_btns)}")

        # Check all clickable elements
        all_buttons = page.locator("button").all()
        print(f"\nAll buttons after new:")
        for i, b in enumerate(all_buttons[:15]):
            try:
                txt = b.inner_text()
                vis = b.is_visible()
                if vis and txt.strip():
                    print(f"  [{i}] {txt.strip()[:80]}")
            except:
                pass

        # ---- Step 4: Type theme and submit ----
        textarea = page.locator("textarea").first
        if textarea.count() > 0:
            print("\n=== Typing theme ===")
            textarea.fill("AI技術の進化と未来")
            page.wait_for_timeout(500)

            # Find send button
            send_btn = page.locator("button[type='submit'], button:has(svg)").all()
            print(f"Potential send buttons: {len(send_btn)}")
            for i, b in enumerate(send_btn[:5]):
                try:
                    vis = b.is_visible()
                    txt = b.inner_text()
                    print(f"  [{i}] visible={vis} text='{txt.strip()[:40]}'")
                except:
                    pass

            # Try pressing Enter to submit
            textarea.press("Enter")
            page.wait_for_timeout(2000)

            page.screenshot(path="/tmp/v03_after_theme.png", full_page=True)
            results["screenshots"].append("/tmp/v03_after_theme.png")

            body_text = page.locator("body").inner_text()
            print("\n=== AFTER THEME INPUT ===")
            print(body_text[:800])

        # ---- Step 5: Check for next question (should be different from theme) ----
        page.wait_for_timeout(1000)

        # Look for outputTarget options (lovart-slides / external-infographic-image)
        all_buttons = page.locator("button").all()
        print(f"\n=== BUTTONS AFTER THEME ===")
        for i, b in enumerate(all_buttons[:20]):
            try:
                txt = b.inner_text()
                vis = b.is_visible()
                if vis and txt.strip():
                    print(f"  [{i}] {txt.strip()[:80]}")
            except:
                pass

        # ---- Report console errors ----
        # Filter out Vite HMR websocket errors (expected in headless)
        real_errors = [e for e in console_errors if "WebSocket" not in e and "vite" not in e.lower()]
        if real_errors:
            print(f"\n=== CONSOLE ERRORS ({len(real_errors)}) ===")
            for e in real_errors:
                print(f"  {e}")
        else:
            print("\nNo runtime console errors (excluding Vite HMR)")

        browser.close()

if __name__ == "__main__":
    main()
