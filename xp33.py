import tkinter as tk
from tkinter import messagebox
import cv2
import csv
import os
from tkvideo import tkvideo
import tobii_research as tr
import threading
import time

class VideoSurveyApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Video Survey App")
        self.root.attributes('-fullscreen', True)  # Set full screen
        self.root.configure(bg="#2C3E50")  # Dark background
        
        self.scenarios = {
            1: ["Videos/scenario1/video1.mp4", "Videos/scenario1/video2.mp4"],
            2: ["Videos/scenario1/video1.mp4", "Videos/scenario1/video2.mp4"]
        }
        
        self.current_scenario = 1
        self.current_video = 0
        self.csv_file = "survey_results.csv"
        self.gaze_data_file = "gaze_data.csv"
        
        if not os.path.exists(self.csv_file):
            with open(self.csv_file, mode='w', newline='') as file:
                writer = csv.writer(file)
                writer.writerow(["Scenario", "Video", "Like", "Safety"])
        
        if not os.path.exists(self.gaze_data_file):
            with open(self.gaze_data_file, mode='w', newline='') as file:
                writer = csv.writer(file)
                writer.writerow(["Timestamp", "Gaze X", "Gaze Y"])
        
        self.start_button = tk.Button(root, text="Start Experiment", command=self.start_scenario, font=("Arial", 18, "bold"), bg="#3498DB", fg="white", padx=20, pady=10)
        self.start_button.pack(pady=50)
        
        # Initialize Tobii eye tracker
        #self.eye_tracker = None
        #self.gaze_data = []
        #self.find_eye_tracker()
    
    def find_eye_tracker(self):
        found_eyetrackers = tr.find_all_eyetrackers()
        if found_eyetrackers:
            self.eye_tracker = found_eyetrackers[0]
    
    def gaze_callback(self, gaze_data):
        timestamp = time.time()
        left_gaze = gaze_data["left_gaze_point_on_display_area"]
        right_gaze = gaze_data["right_gaze_point_on_display_area"]
        gaze_x = (left_gaze[0] + right_gaze[0]) / 2
        gaze_y = (left_gaze[1] + right_gaze[1]) / 2
        
        with open(self.gaze_data_file, mode='a', newline='') as file:
            writer = csv.writer(file)
            writer.writerow([timestamp, gaze_x, gaze_y])
    
    def start_scenario(self):
        self.start_button.pack_forget()
        self.video_label = tk.Label(self.root, text="Click to Play Video", bg="black", fg="white", font=("Arial", 24, "bold"))
        self.video_label.pack(expand=True, fill=tk.BOTH)
        self.video_label.bind("<Button-1>", self.play_video)
    
    def play_video(self, event=None):
        if self.current_video < len(self.scenarios[self.current_scenario]):
            video_path = self.scenarios[self.current_scenario][self.current_video]
            cap = cv2.VideoCapture(video_path)
            
            if not cap.isOpened():
                messagebox.showerror("Error", f"Cannot open video: {video_path}")
                return
            
            fps = int(cap.get(cv2.CAP_PROP_FPS))
            frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            duration = frame_count / fps
            cap.release()
            
            self.video_label.unbind("<Button-1>")
            self.video_label.config(text="")
            screen_width = self.root.winfo_screenwidth()
            screen_height = self.root.winfo_screenheight()
            self.player = tkvideo(video_path, self.video_label, loop=0, size=(screen_width, screen_height))
            self.player.play()
            
            #if self.eye_tracker:
            #    self.eye_tracker.subscribe_to(tr.EYETRACKER_GAZE_DATA, self.gaze_callback, as_dictionary=True)
            
            self.root.after(int(duration * 1000), self.show_questionnaire)
    
    def show_questionnaire(self):
        self.video_label.pack_forget()
        #if self.eye_tracker:
        #    self.eye_tracker.unsubscribe_from(tr.EYETRACKER_GAZE_DATA, self.gaze_callback)
        
        self.question_frame = tk.Frame(self.root, bg="#34495E", padx=20, pady=20)
        self.question_frame.pack()
        
        self.like_var = tk.IntVar()
        self.safety_var = tk.IntVar()
        
        self.create_likert_question("Do you like the video?", self.question_frame, self.like_var)
        self.create_likert_question("Do you feel safe?", self.question_frame, self.safety_var)
        
        tk.Button(self.question_frame, text="Submit", command=self.submit_response, font=("Arial", 16, "bold"), bg="#E74C3C", fg="white", padx=20, pady=10).pack(pady=20)
    
    def create_likert_question(self, text, parent, variable):
        tk.Label(parent, text=text, bg="#34495E", fg="white", font=("Arial", 16)).pack(pady=5)
        frame = tk.Frame(parent, bg="#34495E")
        frame.pack()
        tk.Label(frame, text="1: Not at all", bg="#34495E", fg="white", font=("Arial", 12)).pack(side="left", padx=10)
        for i in range(1, 8):
            tk.Radiobutton(frame, text=str(i), variable=variable, value=i, bg="#ECF0F1", font=("Arial", 14), indicatoron=0, width=4, height=2, selectcolor="#E74C3C").pack(side="left", padx=5)
        tk.Label(frame, text="7: Very much", bg="#34495E", fg="white", font=("Arial", 12)).pack(side="left", padx=10)
    
    def submit_response(self):
        if self.like_var.get() == 0 or self.safety_var.get() == 0:
            messagebox.showwarning("Warning", "Please answer all questions!")
            return
        
        with open(self.csv_file, mode='a', newline='') as file:
            writer = csv.writer(file)
            writer.writerow([self.current_scenario, self.scenarios[self.current_scenario][self.current_video], self.like_var.get(), self.safety_var.get()])
        
        self.question_frame.pack_forget()
        self.current_video += 1
        
        if self.current_video < len(self.scenarios[self.current_scenario]):
            self.start_scenario()
        else:
            self.show_next_scenario_button()

    def show_next_scenario_button(self):
        if self.current_scenario < len(self.scenarios):
            self.next_scenario_button = tk.Button(self.root, text="Next Scenario", command=self.next_scenario, font=("Arial", 18, "bold"), bg="#2ECC71", fg="white", padx=20, pady=10)
            self.next_scenario_button.pack(pady=20)
        else:
            messagebox.showinfo("Experiment Complete", "Thank you for participating!")
            self.root.quit()
    
    def next_scenario(self):
        self.next_scenario_button.pack_forget()
        self.current_video = 0
        self.current_scenario += 1
        self.start_scenario()
    
if __name__ == "__main__":
    root = tk.Tk()
    app = VideoSurveyApp(root)
    root.mainloop()






