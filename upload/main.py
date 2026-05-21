import customtkinter as ctk

from app.ui.dashboard_page import DashboardPage
from app.ui.archive_files_page import ArchiveFilesPage


# App Theme
ctk.set_appearance_mode("dark")
ctk.set_default_color_theme("blue")


class RecordFlowApp(ctk.CTk):

    def __init__(self):
        super().__init__()

        # Window Settings
        self.title("RecordFlow")
        self.geometry("1200x700")

        # Build UI
        self.create_sidebar()
        self.create_main_area()

    def create_sidebar(self):

        self.sidebar = ctk.CTkFrame(
            self,
            width=220,
            corner_radius=0
        )

        self.sidebar.pack(
            side="left",
            fill="y"
        )

        # App Title
        title_label = ctk.CTkLabel(
            self.sidebar,
            text="RecordFlow",
            font=("Segoe UI", 24, "bold")
        )

        title_label.pack(pady=30)

        # Navigation Buttons
        buttons = [
            "Dashboard",
            "Archive Files",
            "Locations",
            "Search",
            "Borrow & Return",
            "Reports",
            "Users",
            "Settings"
        ]

        for button_name in buttons:

            if button_name == "Dashboard":
                command = self.show_dashboard

            elif button_name == "Archive Files":
                command = self.show_archive_files

            else:
                command = None

            button = ctk.CTkButton(
                self.sidebar,
                text=button_name,
                height=40,
                command=command
            )

            button.pack(
                fill="x",
                padx=15,
                pady=5
            )

    def create_main_area(self):

        self.main_frame = ctk.CTkFrame(self)

        self.main_frame.pack(
            side="right",
            fill="both",
            expand=True
        )

        self.show_dashboard()

    def clear_main_frame(self):

        for widget in self.main_frame.winfo_children():
            widget.destroy()

    def show_dashboard(self):

        self.clear_main_frame()

        dashboard = DashboardPage(self.main_frame)

        dashboard.pack(
            fill="both",
            expand=True
        )

    def show_archive_files(self):

        self.clear_main_frame()

        archive_page = ArchiveFilesPage(self.main_frame)

        archive_page.pack(
            fill="both",
            expand=True
        )


if __name__ == "__main__":

    app = RecordFlowApp()
    app.mainloop()