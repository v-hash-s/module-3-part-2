interface User {
  email: string;
  password: string;
}

interface Token {
  token: string;
}

interface Response {
  content: ErrorMessage | Message | Token;
  statusCode: number;
}

interface Message {
  message: string;
}

interface ErrorMessage {
  errorMessage: string;
}

export { User, Token, Response, Message, ErrorMessage };
