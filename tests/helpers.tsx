import { ReactElement } from "react";
import { MemoryRouter } from "react-router-dom";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProfileDataProvider } from "../src/api/store";

/** Render a single page with the data provider (demo mode) + router context. */
export function renderPage(ui: ReactElement, route = "/perfil/inicio") {
  const user = userEvent.setup();
  const utils = render(
    <MemoryRouter initialEntries={[route]}>
      <ProfileDataProvider>{ui}</ProfileDataProvider>
    </MemoryRouter>,
  );
  return { user, ...utils };
}
