import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import App from '../App';

describe('SPA navegable', () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.pushState({}, '', '/');
  });

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
    await user.click(screen.getByRole('button', { name: /reiniciar modo demo/i }));
    expect(await screen.findByRole('heading', { name: /reiniciar todos los datos/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sí, reiniciar/i })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /cancelar/i }));
    await waitFor(() => expect(screen.queryByRole('heading', { name: /reiniciar todos los datos/i })).not.toBeInTheDocument());
  });

  it('mantiene completas y por encima de la navegación las acciones de un registro diferente', async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByRole('heading', { name: /hola, daniel/i });

    await user.click(screen.getAllByRole('link', { name: /registrar comida/i })[0]);
    await user.click(await screen.findByRole('button', { name: /editar lo que comí/i }));
    const eggs = screen.getByRole('spinbutton', { name: /cantidad de huevos completos/i });
    await user.clear(eggs);
    await user.type(eggs, '1');
    await user.click(screen.getByRole('button', { name: /eliminar claras/i }));
    await user.click(screen.getByRole('button', { name: /eliminar 3 tortillas de maíz/i }));
    await user.click(screen.getByRole('button', { name: /guardar registro/i }));

    expect(await screen.findByRole('heading', { name: /registraste menos de lo planeado/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /conservar plan/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ver propuesta/i })).toBeInTheDocument();
    expect(document.querySelector('.modal-layer')?.parentElement).toBe(document.body);
    expect(document.body).toHaveClass('modal-open');

    await user.click(screen.getByRole('button', { name: /conservar plan/i }));
    await waitFor(() => expect(document.querySelector('.modal-layer')).not.toBeInTheDocument());
    expect(document.body).not.toHaveClass('modal-open');
  });
});
