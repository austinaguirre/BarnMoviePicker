// app/styles/pageStyles.ts

// ======== COLORS =========
export const dangerColor = "#71130F";
export const primaryButtonColor = "#226284";
export const secondaryButtonColor = "#444444";
export const pickedColor = "#0c6b03";

export const styles: { [key: string]: React.CSSProperties } = {
    // ====== DARK THEME STYLES ======
    container: {
        margin: "0 auto",
        maxWidth: "500px",
        padding: "1rem",
        fontFamily: "'Helvetica Neue', Arial, sans-serif",
        backgroundColor: "#121212", // Dark background
        color: "#ffffff", // White text
        minHeight: "100vh",
    },
    title: {
        fontSize: "1.8rem",
        marginBottom: "0.5rem",
        textAlign: "center",
    },
    subtitle: {
        textAlign: "center",
        marginBottom: "1rem",
        color: "#ccc",
    },
    loading: {
        fontFamily: "'Helvetica Neue', Arial, sans-serif",
        padding: "1rem",
        textAlign: "center",
        backgroundColor: "#121212",
        color: "#fff",
        minHeight: "100vh",
    },
    // Sign In / Sign Up
    formCard: {
        marginBottom: "1rem",
        border: "1px solid #333",
        borderRadius: "5px",
        padding: "1rem",
        background: "#1e1e1e",
    },
    formHeader: {
        margin: "0 0 0.5rem 0",
        fontSize: "1.2rem",
    },
    inputGroup: {
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
        marginBottom: "0.5rem",
    },
    input: {
        padding: "0.5rem",
        borderRadius: "4px",
        border: "1px solid #444",
        fontSize: "1rem",
        backgroundColor: "#2c2c2c",
        color: "#fff",
    },
    // Buttons
    primaryButton: {
        background: primaryButtonColor,
        color: "#fff",
        border: "none",
        borderRadius: "4px",
        padding: "0.6rem",
        cursor: "pointer",
        marginTop: "0.5rem",
    },
    dangerButton: {
        background: dangerColor,
        color: "#fff",
        border: "none",
        borderRadius: "4px",
        padding: "0.6rem",
        cursor: "pointer",
        marginTop: "0.5rem",
    },
    secondaryButton: {
        background: secondaryButtonColor,
        color: "#fff",
        border: "none",
        borderRadius: "4px",
        padding: "0.4rem 0.8rem",
        cursor: "pointer",
    },
    // Smaller buttons
    primarySmallButton: {
        background: primaryButtonColor,
        color: "#fff",
        border: "none",
        borderRadius: "4px",
        padding: "0.4rem 0.8rem",
        fontSize: "0.85rem",
        cursor: "pointer",
    },
    dangerSmallButton: {
        background: dangerColor,
        color: "#fff",
        border: "none",
        borderRadius: "4px",
        padding: "0.4rem 0.8rem",
        fontSize: "0.85rem",
        cursor: "pointer",
    },
    pickedSmallButton: {
        background: pickedColor,
        color: "#fff",
        border: "none",
        borderRadius: "4px",
        padding: "0.4rem 0.8rem",
        fontSize: "0.85rem",
        cursor: "pointer",
    },
    // Sections
    section: {
        marginTop: "2rem",
        padding: "1rem",
        borderRadius: "8px",
        backgroundColor: "#1e1e1e",
        border: "1px solid #333",
    },
    sectionAlt: {
        backgroundColor: "#242424",
    },
    sectionAlt2: {
        backgroundColor: "#2a2a2a",
    },
    sectionTitle: {
        marginBottom: "1rem",
        fontSize: "1.3rem",
    },
    // Lists
    list: {
        listStyle: "none",
        padding: 0,
        margin: 0,
        marginBottom: "1rem",
    },
    listItem: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "0.5rem",
        marginBottom: "0.5rem",
        border: "1px solid #444",
        borderRadius: "4px",
        background: "#2c2c2c",
    },
    itemActions: {
        display: "flex",
        gap: "0.3rem",
    },
    // Current Pick
    currentPickBox: {
        border: "1px solid #444",
        borderRadius: "4px",
        background: "#2c2c2c",
        padding: "1rem",
        marginBottom: "1rem",
    },
};