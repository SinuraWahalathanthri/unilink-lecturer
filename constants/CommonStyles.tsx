import { StyleSheet } from "react-native";

const CommonStyles = StyleSheet.create({
  inputContainer: {
    marginTop: 8,
  },
  label: {
    fontFamily: "Lato",
    fontSize: 14,
    lineHeight: 20,
    color: "#505050",
  },
  searchInputWrapper: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 12,
    flexDirection: "row",
    width: "100%",
    alignItems: "center",
    marginTop: 10,
    backgroundColor: "#f3f4f6",
  },
  textInput: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: "Lato",
    marginLeft: 8,
    paddingVertical: 0,
    flex: 1,
  },
  focusedInput: {
    borderColor: "#3D83F5",
    borderWidth: 1,
  },
  btnWrapper: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 6,
    borderColor: "#EDEDED",
    borderWidth: 1,
    alignItems: "center",
  },
});

export default CommonStyles;
