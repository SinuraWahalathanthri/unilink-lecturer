import { createContext, useContext, useState } from "react";

const LecturerContext = createContext();

export const LecturerProvider = ({ children }) => {
  const [lecturer, setLecturer] = useState(null);

  return (
    <LecturerContext.Provider value={{ lecturer, setLecturer }}>
      {children}
    </LecturerContext.Provider>
  );
};

export const useLecturer = () => useContext(LecturerContext);
