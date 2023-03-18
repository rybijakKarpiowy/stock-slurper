import { FormEvent, useEffect, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { getFirstDay } from "./funcs";

function App() {
    const [company, setCompany] = useState<"Asgard" | "Axpol" | "Par" | "Stricker">();
    const [reqData, setReqData] = useState<{ days: string; from: string; to: string }>({
        days: "",
        from: "",
        to: "",
    });
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);

    const activeCompanies = ["Axpol", "Par", "Stricker"] as ("Asgard" | "Axpol" | "Par" | "Stricker")[];
    const disabledCompanies = ["Asgard"] as ("Asgard" | "Axpol" | "Par" | "Stricker")[];

    useEffect(() => {
        const daysInput = document.getElementById("days") as HTMLInputElement;
        const fromInput = document.getElementById("from") as HTMLInputElement;
        const toInput = document.getElementById("to") as HTMLInputElement;
        if (!reqData.days && daysInput) {
            daysInput.value = "";
        }
        if (fromInput) {
            if (!reqData.from) {
                fromInput.value = "";
            } else {
                toInput.min = new Date(
                    new Date(reqData.from).setDate(new Date(reqData.from).getDate() + 1)
                )
                    .toISOString()
                    .split("T")[0];
            }
        }
        if (toInput) {
            if (!reqData.to) {
                toInput.value = "";
            } else {
                fromInput.max = new Date(
                    new Date(reqData.to).setDate(new Date(reqData.to).getDate() - 1)
                )
                    .toISOString()
                    .split("T")[0];
            }
        }
    }, [reqData]);

    useEffect(() => {
        (async () => {
            if (company) await getFirstDay(company);
        })();
    }, [company]);

    const handleSubmit = async (
        e: FormEvent<HTMLFormElement>,
        company: "Asgard" | "Axpol" | "Par" | "Stricker",
        reqData: { days: string; from: string; to: string }
    ) => {
        e.preventDefault();
        setLoading(true);

        const socket = new WebSocket("wss://stock-slurper-production.up.railway.app");
        // const socket = new WebSocket("ws://localhost:5000");

        socket.onopen = () => {
            console.log("[open] Connected to server by websocket");
            if (reqData.days) {
                socket.send(JSON.stringify({ company, n: parseInt(reqData.days) + 1 }));
            } else if (reqData.from && reqData.to) {
                socket.send(JSON.stringify({ company, from: reqData.from, to: reqData.to }));
            }
        };

        socket.onmessage = (event) => {
            const { message, spreadsheetLink, progress } = JSON.parse(event.data);
            if (message) {
                if (message === "Podano nieprawidłowy zakres dat, spróbój ponownie") {
                    window.localStorage.removeItem(`storage${company}`);
                    (async () => await getFirstDay(company))();
                }
                toast.warn(message);
                setLoading(false);
                return;
            }

            if (progress) {
                setProgress(parseInt(progress));
                return;
            }

            toast.success("Analiza zakończona pomyślnie!");
            setCompany(undefined);
            setLoading(false);
            setReqData({ days: "", from: "", to: "" });
            setProgress(0);
            setTimeout(() => {
                window.location.href = spreadsheetLink;
            }, 500);
            return;
        };

        socket.onclose = (event) => {
            if (event.wasClean) {
                console.log(
                    `[close] Connection closed cleanly, code=${event.code} reason=${event.reason}`
                );
            } else {
                // e.g. server process killed or network down
                // event.code is usually 1006 in this case
                console.log("[close] Connection died");
            }
        };

        socket.onerror = () => {
            console.log(`[error]`);
        };
    };

    return (
        <div className="main">
            <ToastContainer
                position="bottom-center"
                autoClose={3000}
                limit={3}
                hideProgressBar={false}
                newestOnTop
                closeOnClick
                rtl={false}
                pauseOnFocusLoss={false}
                draggable={false}
                pauseOnHover
                theme="dark"
                style={{ fontSize: "16px" }}
            />
            {company ? (
                <form
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        justifyItems: "center",
                        alignItems: "center",
                        width: "max-content",
                        position: "relative",
                    }}
                    onSubmit={(e) => handleSubmit(e, company, reqData)}
                >
                    <button
                        className={`goback button ${loading && "disabled"}`}
                        type="button"
                        style={{ padding: "0", position: "absolute", left: "0" }}
                        disabled={loading}
                        onClick={() => {
                            setCompany(undefined);
                            setReqData({ days: "", from: "", to: "" });
                        }}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth="1.5"
                            stroke="currentColor"
                            style={{ width: "24px", height: "24px" }}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3"
                            />
                        </svg>
                    </button>
                    <h1>{company}</h1>
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "row",
                            justifyContent: "center",
                            alignContent: "center",
                            gap: "32px",
                            paddingLeft: "38px",
                            paddingTop: "16px",
                            paddingBottom: "20px",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                alignContent: "center",
                            }}
                        >
                            <span style={{ fontWeight: "400", fontSize: "32px" }}>Przeanalizuj ostatnie dni</span>
                            <label
                                htmlFor="days"
                                style={{
                                    display: "flex",
                                    flexDirection: "row",
                                    alignContent: "center",
                                    justifyContent: "center",
                                    marginTop: "16px",
                                }}
                            >
                                <p style={{ margin: "0", fontWeight: "300" }}>Dni:</p>
                                <input
                                    type="number"
                                    min="1"
                                    id="days"
                                    onChange={(e) =>
                                        setReqData({
                                            days: (e.target as HTMLInputElement).value,
                                            from: "",
                                            to: "",
                                        })
                                    }
                                    disabled={loading}
                                    placeholder="min. 1"
                                />
                            </label>
                        </div>
                        <div
                            style={{ height: "100%", width: "6px", backgroundColor: "#1a1a1a" }}
                        ></div>
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                alignContent: "center",
                            }}
                        >
                            <span style={{ fontWeight: "400", fontSize: "32px" }}>Przeanalizuj wybrany okres</span>
                            <label
                                htmlFor="from"
                                style={{
                                    display: "flex",
                                    flexDirection: "row",
                                    alignContent: "center",
                                    justifyContent: "center",
                                    marginTop: "16px",
                                }}
                            >
                                <p style={{ margin: "0", fontWeight: "300" }}>Od:</p>
                                <input
                                    type="date"
                                    id="from"
                                    max={
                                        new Date(
                                            new Date(
                                                new Date().toISOString().split("T")[0]
                                            ).setDate(new Date().getDate() - 1)
                                        )
                                            .toISOString()
                                            .split("T")[0]
                                    }
                                    onChange={(e) =>
                                        setReqData({
                                            days: "",
                                            from: (e.target as HTMLInputElement).value,
                                            to: reqData.to,
                                        })
                                    }
                                    disabled={loading}
                                />
                            </label>
                            <label
                                htmlFor="to"
                                style={{
                                    display: "flex",
                                    flexDirection: "row",
                                    alignContent: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <p style={{ margin: "0", fontWeight: "300" }}>Do:</p>
                                <input
                                    type="date"
                                    id="to"
                                    max={new Date().toISOString().split("T")[0]}
                                    onChange={(e) =>
                                        setReqData({
                                            days: "",
                                            from: reqData.from,
                                            to: (e.target as HTMLInputElement).value,
                                        })
                                    }
                                    disabled={loading}
                                />
                            </label>
                        </div>
                    </div>
                    <button
                        className={`submit button ${
                            ((!reqData.days && (!reqData.from || !reqData.to)) || loading) &&
                            "disabled"
                        } ${loading && "loadingBorder"}`}
                        type="submit"
                        disabled={(!reqData.days && (!reqData.from || !reqData.to)) || loading}
                    >
                        {loading ? "Ładowanie..." : "Analizuj"}
                    </button>
                    {loading && <progress value={progress} max="22"></progress>}
                </form>
            ) : (
                <>
                    <h1>Lokomotywy</h1>
                    <span>Wybierz firmę, której dane chcesz przeanalizować</span>
                    <div className="buttons">
                        {disabledCompanies.map((name) => (
                            <button
                                className="button disabled"
                                onClick={() => setCompany(name)}
                                disabled
                            >
                                {name}
                            </button>
                        ))}
                        {activeCompanies.map((name) => (
                            <button className="button" onClick={() => setCompany(name)}>
                                {name}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

export default App;
