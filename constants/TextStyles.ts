import { TextStyle, Platform } from "react-native";

const ios = Platform.OS === 'ios';
const platformWeightDiff = 100;
const weight = (value: number): TextStyle['fontWeight'] => 
  (ios ? value: value + platformWeightDiff).toString() as TextStyle['fontWeight'];

export const textStyles: Record<string, TextStyle> = {
  logo: {
    fontSize: 40,
    fontWeight: weight(600),
    fontFamily: "Poppins",
  },
  title: {
    fontSize: 24,
    fontWeight: weight(600),
    fontFamily: "Poppins",
  },
  subtitle: {
    fontSize: 24,
    fontWeight: weight(400),
    fontFamily: "Poppins",
  },
  mainSection: {
    fontSize: 20,
    fontWeight: weight(600),
    fontFamily: "Poppins",
  },
  section: {
    fontSize: 18,
    fontWeight: weight(700),
    fontFamily: "Montserrat",
  },
  btnText: {
    fontSize: 18,
    fontWeight: weight(400),
    fontFamily: "Montserrat",
  },
  description: {
    fontSize: 16,
    fontWeight: weight(400),
    fontFamily: "Montserrat",
  },
  link: {
    fontSize: 16,
    fontFamily: "System",
    textDecorationLine: "underline",
  },
  default: {
    fontSize: 16,
    fontWeight: weight(400),
    fontFamily: "Montserrat",
  },
  defaultSemiBold: {
    fontSize: 16,
    fontFamily: "Montserrat",
    fontWeight: weight(700),
  },
  defautlSmall: {
    fontSize: 14,
    fontFamily: "Montserrat",
    fontWeight: weight(400),
  },
  small: {
    fontSize: 10,
    fontFamily: "Montserrat",
    fontWeight: weight(600),
  },
};
