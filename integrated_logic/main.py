from tkinter import *
import pandas as pd
import tkinter as tk
from playsound import playsound
from PIL import Image, ImageTk
import numpy as np
from tkinter import ttk
import sqlite3
import cv2
from PIL import Image
import os
import xlsxwriter
from datetime import date
from tkinter import messagebox
import sys
import random
import subprocess
from creating_dataset import cd_main
from Prediction import pred_main
from Reverse_Recognition import rr_main

# global variables
# sunset-inspired color palette for the UI
SUNSET_BG = "#2b1b3f"        # deep purple background
SUNSET_HEADER = "#ff8c42"   # warm orange header
SUNSET_FOOTER = "#3b2645"   # darker purple footer/status
SUNSET_TEXT = "#ffffff"     # white text for contrast

bg = None
selection = 1

# resolve database path relative to this file so it works from any CWD
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FILES_DIR = os.path.join(BASE_DIR, "files")
DB_PATH = os.path.join(FILES_DIR, "users_info.db")


# =====================Create Database=============================================
def createdb():
    os.makedirs(FILES_DIR, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute(
        "CREATE TABLE IF NOT EXISTS users (name TEXT , passs TEXT,sqltime TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL)")
    conn.commit()
    conn.close()


createdb()


# ======================Adding new user in database===============================
def saveadmin():
    name_err = name_entry.get()
    pass_err = pass_entry.get()
    if name_err == "":
        messagebox.showinfo("Invalid input", "Username can't be Empty")
    elif pass_err == "":
        messagebox.showinfo("Invalid input", "Password can't be Empty")
    else:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute("INSERT INTO users(name,passs) VALUES(?,?) ", (name_entry.get(), pass_entry.get()))
        conn.commit()
        messagebox.showinfo("Information", "New User has been Added")


# ========================Fetching data of user from database==========================
def loggin():
    while True:
        a = name2_entry.get()
        b = pass2_entry.get()
        with sqlite3.connect(DB_PATH) as db:
            cursor = db.cursor()
        find_user = ("SELECT * FROM users WHERE name = ? AND passs = ?")
        cursor.execute(find_user, [(a), (b)])
        results = cursor.fetchall()
        if results:
            for i in results:
                window.destroy()
                # ==================Window2+CreateFrame+Animation============================================================
                window2 = Tk()
                f1 = Frame(window2, bg=SUNSET_BG)
                f2 = Frame(window2, bg=SUNSET_BG)
                f3 = Frame(window2, bg=SUNSET_BG)
                f4 = Frame(window2, bg=SUNSET_BG)

                def swap(frame):
                    frame.tkraise()

                for frame in (f1, f2, f3, f4):
                    frame.place(x=0, y=0, width=400, height=400)
                window2.geometry("400x400+420+170")
                window2.resizable(False, False)
                window2.configure(bg=SUNSET_BG)

                label3 = Label(f1, text="User Panel", font=("arial", 20, "bold"),
                               bg=SUNSET_HEADER, fg=SUNSET_TEXT,
                               relief=SUNKEN)
                label3.pack(side=TOP, fill=X)

                label4 = Label(
                    f2,
                    text="                            Indian Sign Language Recognition System",
                    font=("arial", 10, "bold"),
                    bg=SUNSET_FOOTER,
                    fg=SUNSET_TEXT,
                )
                label4.pack(side=BOTTOM, fill=X)
                statusbar = Label(
                    f1,
                    text="                            Indian Sign Language Recognition System",
                    font=("arial", 8, "bold"),
                    bg=SUNSET_FOOTER,
                    fg=SUNSET_TEXT,
                    relief=SUNKEN,
                    anchor=W,
                )
                statusbar.pack(side=BOTTOM, fill=X)

                class AnimatedGIF(Label, object):
                    def __init__(self, master, path, forever=True):
                        self._master = master
                        self._loc = 0
                        self._forever = forever
                        self._is_running = False

                        # resolve image path relative to this file
                        img_path = path
                        if not os.path.isabs(img_path):
                            img_path = os.path.join(BASE_DIR, img_path)

                        self._frames = []
                        try:
                            im = Image.open(img_path)
                            i = 0
                            try:
                                while True:
                                    photoframe = ImageTk.PhotoImage(im.copy().convert('RGBA'))
                                    self._frames.append(photoframe)
                                    i += 1
                                    im.seek(i)
                            except EOFError:
                                pass
                            self._last_index = len(self._frames) - 1
                            try:
                                self._delay = im.info.get('duration', 100)
                            except Exception:
                                self._delay = 100
                        except FileNotFoundError:
                            # if GIF is missing, fall back to an empty transparent frame
                            blank = Image.new('RGBA', (1, 1), (0, 0, 0, 0))
                            self._frames.append(ImageTk.PhotoImage(blank))
                            self._last_index = 0
                            self._delay = 100

                        self._callback_id = None
                        super(AnimatedGIF, self).__init__(master, image=self._frames[0])

                    def start_animation(self, frame=None):
                        if self._is_running: return
                        if frame is not None:
                            self._loc = 0
                            self.configure(image=self._frames[frame])
                        self._master.after(self._delay, self._animate_GIF)
                        self._is_running = True

                    def stop_animation(self):
                        if not self._is_running: return
                        if self._callback_id is not None:
                            self.after_cancel(self._callback_id)
                            self._callback_id = None
                        self._is_running = False

                    def _animate_GIF(self):
                        self._loc += 1
                        self.configure(image=self._frames[self._loc])
                        if self._loc == self._last_index:
                            if self._forever:
                                self._loc = 0
                                self._callback_id = self._master.after(self._delay, self._animate_GIF)
                            else:
                                self._callback_id = None
                                self._is_running = False
                        else:
                            self._callback_id = self._master.after(self._delay, self._animate_GIF)

                    def pack(self, start_animation=True, **kwargs):
                        if start_animation:
                            self.start_animation()
                        super(AnimatedGIF, self).pack(**kwargs)

                    def grid(self, start_animation=True, **kwargs):
                        if start_animation:
                            self.start_animation()
                        super(AnimatedGIF, self).grid(**kwargs)

                    def place(self, start_animation=True, **kwargs):
                        if start_animation:
                            self.start_animation()
                        super(AnimatedGIF, self).place(**kwargs)

                    def pack_forget(self, **kwargs):
                        self.stop_animation()
                        super(AnimatedGIF, self).pack_forget(**kwargs)

                    def grid_forget(self, **kwargs):
                        self.stop_animation()
                        super(AnimatedGIF, self).grid_forget(**kwargs)

                    def place_forget(self, **kwargs):
                        self.stop_animation()
                        super(AnimatedGIF, self).place_forget(**kwargs)

                if __name__ == "__main__":
                    # simple sun-rise animation drawn on a canvas
                    canvas = Canvas(f1, width=260, height=220, bg=SUNSET_BG, highlightthickness=0)
                    canvas.pack(pady=10)

                    # sky and horizon
                    canvas.create_rectangle(0, 0, 260, 220, fill=SUNSET_BG, outline="")
                    canvas.create_rectangle(0, 140, 260, 220, fill=SUNSET_FOOTER, outline="")

                    sun_radius = 40
                    sun_center_x = 130
                    start_center_y = 190
                    target_center_y = 90

                    sun = canvas.create_oval(
                        sun_center_x - sun_radius,
                        start_center_y - sun_radius,
                        sun_center_x + sun_radius,
                        start_center_y + sun_radius,
                        fill="#ffb45a",
                        outline="",
                    )

                    target_top = target_center_y - sun_radius

                    def animate_sun():
                        x1, y1, x2, y2 = canvas.coords(sun)
                        if y1 <= target_top:
                            return
                        canvas.move(sun, 0, -1)
                        canvas.after(20, animate_sun)

                    animate_sun()

                label4 = Label(
                    f3,
                    text="                            Indian Sign Language Recognition System",
                    font=("arial", 10, "bold"),
                    bg=SUNSET_FOOTER,
                    fg=SUNSET_TEXT,
                )
                label4.pack(side=BOTTOM, fill=X)

                # =========================Main Buttons=========================================

                btn2w2 = ttk.Button(f1, text="Predict Sign", command=pred_main)
                btn2w2.place(x=255, y=115, width=150, height=30)

                def launch_text_audio_isl():
                    try:
                        # Open ISL Bridge Web App (text + audio -> ISL)
                        base_dir = os.path.dirname(os.path.abspath(__file__))
                        project_root = os.path.dirname(os.path.dirname(base_dir))
                        isl_bridge_root = os.path.join(project_root, "isl-bridge-main")
                        if not os.path.isdir(isl_bridge_root):
                            messagebox.showerror(
                                "Missing isl-bridge-main",
                                f"Could not find 'isl-bridge-main' at:\n{isl_bridge_root}",
                            )
                            return

                        isl_bridge_port = 8080
                        web_url = f"http://localhost:{isl_bridge_port}/"

                        # If dependencies aren't installed yet, explain how to fix.
                        vite_bin = os.path.join(isl_bridge_root, "node_modules", ".bin", "vite")
                        if not os.path.exists(vite_bin):
                            messagebox.showerror(
                                "ISL Bridge not ready",
                                "The ISL Bridge app dependencies are not installed.\n\n"
                                "Run these commands inside:\n"
                                f"  {isl_bridge_root}\n\n"
                                "  npm install --no-audit --no-fund\n"
                                "  npm run dev\n"
                                f"\nThen open: {web_url}",
                            )
                            os.system(f'start \"\" \"{web_url}\"')
                            return

                        # Helper to check if the expected dev server port is open.
                        def is_port_open(host, port):
                            import socket

                            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                                s.settimeout(0.5)
                                return s.connect_ex((host, port)) == 0

                        # Best-effort: start dev server if port isn't open yet.
                        try:
                            if not is_port_open("127.0.0.1", isl_bridge_port):
                                subprocess.Popen(
                                    ["npm", "run", "dev"],
                                    cwd=isl_bridge_root,
                                    stdout=subprocess.DEVNULL,
                                    stderr=subprocess.DEVNULL,
                                )
                                # Wait a bit for the dev server to be ready, then open the URL.
                                # This avoids opening the page while Vite is still starting.
                                import time
                                for _ in range(40):  # ~20 seconds total
                                    if is_port_open("127.0.0.1", isl_bridge_port):
                                        break
                                    time.sleep(0.5)
                        except Exception:
                            # Even if auto-start fails, we still try opening the URL.
                            pass

                        # If it still isn't open, show a helpful error.
                        if not is_port_open("127.0.0.1", isl_bridge_port):
                            messagebox.showerror(
                                "ISL Bridge server not running",
                                "Could not reach the ISL Bridge dev server.\n\n"
                                "Try running manually:\n"
                                f"  cd \"{isl_bridge_root}\"\n"
                                "  npm run dev\n\n"
                                f"Expected: {web_url}",
                            )

                        os.system(f'start "" \"{web_url}\"')
                    except Exception as e:
                        messagebox.showerror("Error", f"Failed to open ISL Bridge:\n{e}")

                btn3w2 = ttk.Button(f1, text="Translate speech", command=launch_text_audio_isl)
                btn3w2.place(x=255, y=170, width=150, height=30)

                btn6w2 = ttk.Button(f1, text="Create Signs", command=cd_main)
                btn6w2.place(x=255, y=225, width=150, height=30)

                # =========================Developers Page=========================================

                label10 = Label(f4, text="", font=("arial", 20, "bold"), bg=SUNSET_HEADER, fg=SUNSET_TEXT)
                label10.pack(side=TOP, fill=X)
                label11 = Label(
                    f4,
                    text="     Indian Sign Language Recognition System",
                    font=("arial", 10, "bold"),
                    bg=SUNSET_FOOTER,
                    fg=SUNSET_TEXT,
                )
                label11.pack(side=BOTTOM, fill=X)

                label10 = Label(f4, text=" Information Will be Added Soon!", font=("arial", 12, "bold"))
                label10.place(x=75, y=150)

                def swap4(frame):
                    frame.tkraise()
                    statusbar['text'] = '                            Indian Sign Language Recognition System'

                btn4w2 = ttk.Button(f4, text="Back	", command=lambda: swap4(f1))
                btn4w2.place(x=3, y=40, width=50, height=30)

                def swap3(frame):
                    frame.tkraise()

                btn9w2 = ttk.Button(f1, text="Developers", command=lambda: swap3(f4))
                btn9w2.place(x=255, y=280, width=150, height=30)

                def quit():
                    window2.destroy()

                btn9w2 = ttk.Button(f1, text="Exit", command=quit)
                btn9w2.place(x=255, y=335, width=150, height=30)

                f1.tkraise()
                window2.mainloop()

            break
        else:
            messagebox.showerror("Error", "invalid username or password")
            break


# ======================Main Login Screen============================================

window = Tk()
window.title("Login Panel")

# apply sunset theme to the login/sign-up window
window.configure(bg=SUNSET_BG)

Label1 = Label(
    window,
    text="Login Panel",
    font=("arial", 20, "bold"),
    bg=SUNSET_HEADER,
    fg=SUNSET_TEXT,
)
Label1.pack(side=TOP, fill=X)

Label2 = Label(
    window,
    text="",
    font=("arial", 10, "bold"),
    bg=SUNSET_FOOTER,
    fg=SUNSET_TEXT,
)
Label2.pack(side=BOTTOM, fill=X)

# create a ttk style that matches the sunset palette
style = ttk.Style()
style.theme_use("clam")
style.configure(
    "Sunset.TFrame",
    background=SUNSET_BG,
)
style.configure(
    "Sunset.TNotebook",
    background=SUNSET_BG,
    borderwidth=0,
)
style.configure(
    "Sunset.TNotebook.Tab",
    padding=(10, 4),
    background=SUNSET_FOOTER,
    foreground=SUNSET_TEXT,
)
style.map(
    "Sunset.TNotebook.Tab",
    background=[("selected", SUNSET_HEADER)],
)
style.configure(
    "Sunset.TButton",
    padding=4,
    background=SUNSET_HEADER,
    foreground=SUNSET_TEXT,
)

# ====================Login and Signup Tabs====================================

nb = ttk.Notebook(window, style="Sunset.TNotebook")
tab1 = ttk.Frame(nb, style="Sunset.TFrame")
tab2 = ttk.Frame(nb, style="Sunset.TFrame")
nb.add(tab1, text="Login")
nb.add(tab2, text="Sign_up")
nb.pack(expand=True, fill="both")

# helper to create sunset labels
def sunset_label(parent, text, **kwargs):
    return Label(parent, text=text, font=("arial", 10, "bold"), bg=SUNSET_BG, fg=SUNSET_TEXT, **kwargs)

# =============Login tab=========================================

name2_label = sunset_label(tab1, "Name")
name2_label.place(x=10, y=10)
name2_entry = StringVar()
name2_entry = ttk.Entry(tab1, textvariable=name2_entry)
name2_entry.place(x=90, y=10)
name2_entry.focus()

pass2_label = sunset_label(tab1, "Password")
pass2_label.place(x=10, y=40)
pass2_entry = StringVar()
pass2_entry = ttk.Entry(tab1, textvariable=pass2_entry, show="*")
pass2_entry.place(x=90, y=40)

# =====================Signup Tab===============================
name_label = sunset_label(tab2, "Name")
name_label.place(x=10, y=10)
name_entry = StringVar()
name_entry = ttk.Entry(tab2, textvariable=name_entry)
name_entry.place(x=90, y=10)
name_entry.focus()
pass_label = sunset_label(tab2, "Password")
pass_label.place(x=10, y=40)
pass_entry = StringVar()
pass_entry = ttk.Entry(tab2, textvariable=pass_entry, show="*")
pass_entry.place(x=90, y=40)


def clear():
    name_entry.delete(0, END)
    pass_entry.delete(0, END)

# ===============User Buttons==============================================

btn1 = ttk.Button(tab2, text="Add User", command=saveadmin, style="Sunset.TButton")
btn1.place(x=50, y=80)
btn2 = ttk.Button(tab2, text="Clear", command=clear, style="Sunset.TButton")
btn2.place(x=140, y=80)

# ================Login Button Main======================================

btn3 = ttk.Button(tab1, text="Login", width=20, command=loggin, style="Sunset.TButton")
btn3.place(x=87, y=80)

window.geometry("400x400+420+170")
window.resizable(False, False)
window.mainloop()
