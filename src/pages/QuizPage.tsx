import { useEffect } from "react";
import { captureUtmParams, getUtmQueryString } from "@/lib/utm";

const QuizPage = () => {
  // Re-capture params on quiz page load (user lands here with params)
  useEffect(() => {
    captureUtmParams();
  }, []);

  // Build quiz iframe URL forwarding all stored params
  const qs = getUtmQueryString();
  const quizSrc = `/quiz/index.html${qs ? `?${qs}` : ""}`;

  return (
    <iframe
      src={quizSrc}
      title="Quiz FRAN"
      className="w-full h-screen border-0"
      style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", zIndex: 50 }}
    />
  );
};

export default QuizPage;