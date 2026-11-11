import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import HomePage from "@/app/page";

describe("Home page", () => {
  it("lists the sample records with type badges", async () => {
    render(<HomePage />);
    expect(await screen.findByText(/My Records/)).toBeInTheDocument();
    expect(await screen.findByText(/Hospital Discharge Summary/)).toBeInTheDocument();
    expect(await screen.findByText(/Lab Report — Blood Work/)).toBeInTheDocument();
    expect(screen.getAllByText(/SAMPLE — fictional/).length).toBe(3);
  });

  it("shows the demo privacy disclaimer", async () => {
    render(<HomePage />);
    expect(await screen.findByPlaceholderText(/Search by title or text/)).toBeInTheDocument();
  });
});
