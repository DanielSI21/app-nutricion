import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import App from '../App';

describe('SPA navegable', () => {
  beforeEach(() => localStorage.clear());

  it('carga Hoy, navega al plan y abre el registro de desayuno', async () => {
    const user = userEvent.setup();
    render(<App />);
    expect(await screen.findByRole('heading', { name: /hola, daniel/i })).toBeInTheDocument();
    expect(screen.getByText(/tu día está listo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/0 de 4 comidas registradas/i)).toBeInTheDocument();

    await user.click(screen.getAllByRole('link', { name: /mi plan/i })[0]);
    expect(await screen.findByRole('heading', { name: 'Mi plan' })).toBeInTheDocument();
    expect(screen.getByText('3 huevos completos + 2 claras')).toBeInTheDocument();

    await user.click(screen.getAllByRole('link', { name: /^hoy$/i })[0]);
    await waitFor(() => expect(screen.getByRole('heading', { name: /comidas de hoy/i })).toBeInTheDocument());
    await user.click(screen.getAllByRole('link', { name: /registrar comida/i })[0]);
    expect(await screen.findByRole('heading', { name: 'Desayuno' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /comí lo planeado/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /editar lo que comí/i })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /comí lo planeado/i }));
    expect(await screen.findByLabelText(/1 de 4 comidas registradas/i)).toBeInTheDocument();

    await user.click(screen.getAllByRole('link', { name: /agregar/i })[0]);
    expect(await screen.findByRole('heading', { name: /agregar alimento/i })).toBeInTheDocument();
    await user.click(screen.getAllByRole('link', { name: /recetas/i })[0]);
    expect(await screen.findByRole('heading', { name: 'Recetas' })).toBeInTheDocument();
    await user.click(screen.getAllByRole('link', { name: /perfil/i })[0]);
    expect(await screen.findByRole('heading', { name: 'Daniel' })).toBeInTheDocument();
  });
});
