import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { createNavStore } from '@sudobility/navigation';
import { NavBar } from '../components/navigation/NavBar';
import { SlidingPanel } from '../components/navigation/SlidingPanel';
import { SlidePanel } from '../components/navigation/SlidePanel';

// Force reduced motion so push/pop are instant and deterministic (no rAF/timer).
beforeEach(() => {
  window.matchMedia = vi
    .fn()
    .mockReturnValue({ matches: true }) as unknown as typeof window.matchMedia;
});

const screens = {
  home: () => <div>HOME BODY</div>,
  detail: () => <div>DETAIL BODY</div>,
};

describe('SlidingPanel', () => {
  it('renders the top screen and its title', () => {
    const store = createNavStore([{ key: 'home', nav: { title: 'Home' } }]);
    render(<SlidingPanel store={store} screens={screens} />);
    expect(screen.getByText('HOME BODY')).toBeInTheDocument();
    expect(screen.getByText('Home')).toBeInTheDocument();
  });

  it('push shows the new screen and pop returns, firing onPopComplete', () => {
    const store = createNavStore([{ key: 'home', nav: { title: 'Home' } }]);
    const onPopComplete = vi.fn();
    render(
      <SlidingPanel
        store={store}
        screens={screens}
        onPopComplete={onPopComplete}
      />
    );

    act(() =>
      store.getState().push({ key: 'detail', nav: { title: 'Detail' } })
    );
    expect(screen.getByText('DETAIL BODY')).toBeInTheDocument();
    expect(store.getState().current()?.key).toBe('detail');
    // A back control appears once the stack can go back.
    expect(screen.getByRole('button', { name: 'Back' })).toBeInTheDocument();

    act(() => store.getState().pop());
    expect(screen.getByText('HOME BODY')).toBeInTheDocument();
    // The popped screen is unmounted once gone.
    expect(screen.queryByText('DETAIL BODY')).not.toBeInTheDocument();
    expect(onPopComplete).toHaveBeenCalledTimes(1);
    expect(onPopComplete.mock.calls[0][0].key).toBe('detail');
  });

  it('keeps screens below the top mounted (state survives navigation)', () => {
    // A pushed screen must not unmount the one beneath it — the regression this guards against was
    // the top-only render that remounted (and reset) lower screens on every navigation.
    const store = createNavStore([{ key: 'home', nav: { title: 'Home' } }]);
    render(<SlidingPanel store={store} screens={screens} />);
    act(() =>
      store.getState().push({ key: 'detail', nav: { title: 'Detail' } })
    );
    expect(screen.getByText('DETAIL BODY')).toBeInTheDocument();
    // Home is still in the document — mounted beneath detail, not unmounted.
    expect(screen.getByText('HOME BODY')).toBeInTheDocument();
  });

  it('does not treat reset/replace as a back-eligible navigation', () => {
    // reset swaps the stack wholesale; the new single screen is the root, so no back control.
    const store = createNavStore([{ key: 'home', nav: { title: 'Home' } }]);
    render(<SlidingPanel store={store} screens={screens} />);
    act(() =>
      store.getState().push({ key: 'detail', nav: { title: 'Detail' } })
    );
    act(() =>
      store.getState().reset([{ key: 'home', nav: { title: 'Home' } }])
    );
    expect(screen.getByText('HOME BODY')).toBeInTheDocument();
    expect(screen.queryByText('DETAIL BODY')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Back' })
    ).not.toBeInTheDocument();
  });

  it('the back control pops the stack', () => {
    const store = createNavStore([{ key: 'home', nav: { title: 'Home' } }]);
    render(<SlidingPanel store={store} screens={screens} />);
    act(() =>
      store.getState().push({ key: 'detail', nav: { title: 'Detail' } })
    );
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(screen.getByText('HOME BODY')).toBeInTheDocument();
  });

  it('drawer mode: hidden panel stays mounted (keeps state) and is marked non-interactive', () => {
    const store = createNavStore([{ key: 'home', nav: { title: 'Home' } }]);
    const { container } = render(
      <SlidingPanel store={store} screens={screens} open={false} />
    );
    // Content is still mounted while the drawer is closed, so its stack keeps state.
    expect(screen.getByText('HOME BODY')).toBeInTheDocument();
    // The whole panel is marked hidden + non-interactive.
    expect(container.querySelector('[aria-hidden="true"]')).toBeTruthy();
  });

  it('drawer mode: closing fires onHidden once the slide-out completes', () => {
    const store = createNavStore([{ key: 'home', nav: { title: 'Home' } }]);
    const onHidden = vi.fn();
    const { rerender } = render(
      <SlidingPanel store={store} screens={screens} open onHidden={onHidden} />
    );
    expect(onHidden).not.toHaveBeenCalled();
    rerender(
      <SlidingPanel
        store={store}
        screens={screens}
        open={false}
        onHidden={onHidden}
      />
    );
    expect(onHidden).toHaveBeenCalledTimes(1);
  });

  it('uncontrolled (no open prop): the panel fills its parent, not aria-hidden', () => {
    const store = createNavStore([{ key: 'home', nav: { title: 'Home' } }]);
    const { container } = render(
      <SlidingPanel store={store} screens={screens} />
    );
    expect(container.querySelector('[aria-hidden="true"]')).toBeNull();
  });
});

describe('NavBar', () => {
  it('renders title/subtitle and fires action + back handlers', () => {
    const onPress = vi.fn();
    const onBack = vi.fn();
    render(
      <NavBar
        spec={{
          title: 'Title',
          subtitle: 'Sub',
          actions: [{ id: 'a', label: 'Do thing', onPress }],
        }}
        canGoBack
        onBack={onBack}
      />
    );
    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Sub')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Do thing' }));
    expect(onPress).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('spec.back.onPress wins over onBack, and an explicit back.visible=false hides it', () => {
    const specPress = vi.fn();
    const onBack = vi.fn();
    const { rerender } = render(
      <NavBar
        spec={{ title: 'T', back: { onPress: specPress } }}
        canGoBack
        onBack={onBack}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(specPress).toHaveBeenCalledTimes(1);
    expect(onBack).not.toHaveBeenCalled();

    rerender(
      <NavBar
        spec={{ title: 'T', back: { visible: false } }}
        canGoBack
        onBack={onBack}
      />
    );
    expect(
      screen.queryByRole('button', { name: 'Back' })
    ).not.toBeInTheDocument();
  });

  it('renders nothing when hidden', () => {
    const { container } = render(
      <NavBar spec={{ title: 'T', hidden: true }} />
    );
    expect(container).toBeEmptyDOMElement();
  });
});

describe('SlidePanel', () => {
  it('renders its children when open', () => {
    render(
      <SlidePanel open>
        <div>PANEL BODY</div>
      </SlidePanel>
    );
    expect(screen.getByText('PANEL BODY')).toBeInTheDocument();
  });

  it('is not mounted when closed from the start', () => {
    const { container } = render(
      <SlidePanel open={false}>
        <div>PANEL BODY</div>
      </SlidePanel>
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('unmounts and fires onHidden when closed', () => {
    const onHidden = vi.fn();
    const { rerender } = render(
      <SlidePanel open onHidden={onHidden}>
        <div>PANEL BODY</div>
      </SlidePanel>
    );
    expect(screen.getByText('PANEL BODY')).toBeInTheDocument();
    // The parent stops passing children as it closes (as `{cond && <Panel/>}` does).
    rerender(<SlidePanel open={false} onHidden={onHidden} />);
    // Reduced motion cuts instantly: unmounted + notified.
    expect(screen.queryByText('PANEL BODY')).not.toBeInTheDocument();
    expect(onHidden).toHaveBeenCalledTimes(1);
  });
});
