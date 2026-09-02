import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import * as React from 'react'

import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs'

function ExampleTabs({
  defaultValue = 'overview',
  orientation = 'horizontal',
}: {
  defaultValue?: string
  orientation?: 'horizontal' | 'vertical'
}) {
  return (
    <Tabs defaultValue={defaultValue} orientation={orientation}>
      <TabsList aria-label="Workspace sections">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="details">Details</TabsTrigger>
        <TabsTrigger value="disabled" disabled>
          Disabled
        </TabsTrigger>
      </TabsList>
      <TabsContent value="overview">Overview panel</TabsContent>
      <TabsContent value="details">Details panel</TabsContent>
      <TabsContent value="disabled">Disabled panel</TabsContent>
    </Tabs>
  )
}

describe('Tabs', () => {
  it('renders the default tab and associates it with its panel', () => {
    render(<ExampleTabs />)

    const activeTab = screen.getByRole('tab', { name: 'Overview' })
    const activePanel = screen.getByRole('tabpanel')

    expect(activeTab.getAttribute('aria-selected')).toBe('true')
    expect(activeTab.getAttribute('data-active')).not.toBeNull()
    expect(activeTab.getAttribute('aria-controls')).toBe(activePanel.id)
    expect(activePanel.getAttribute('aria-labelledby')).toBe(activeTab.id)
    expect(activePanel.textContent).toBe('Overview panel')
  })

  it('switches panels on click and does not activate disabled tabs', () => {
    render(<ExampleTabs />)

    fireEvent.click(screen.getByRole('tab', { name: 'Details' }))
    expect(screen.getByRole('tab', { name: 'Details' }).getAttribute('aria-selected')).toBe(
      'true',
    )
    expect(screen.getByText('Details panel')).toBeTruthy()
    expect(screen.queryByText('Overview panel')).toBeNull()

    const disabledTab = screen.getByRole('tab', { name: 'Disabled' })
    expect(disabledTab.getAttribute('aria-disabled')).toBe('true')
    fireEvent.click(disabledTab)
    expect(disabledTab.getAttribute('aria-selected')).not.toBe('true')
  })

  it('supports controlled values', () => {
    function ControlledTabs() {
      const [value, setValue] = React.useState('overview')

      return (
        <>
          <Tabs value={value} onValueChange={setValue}>
            <TabsList aria-label="Controlled sections">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
            </TabsList>
            <TabsContent value="overview">Overview panel</TabsContent>
            <TabsContent value="details">Details panel</TabsContent>
          </Tabs>
          <output>{value}</output>
        </>
      )
    }

    render(<ControlledTabs />)
    fireEvent.click(screen.getByRole('tab', { name: 'Details' }))

    expect(screen.getByRole('tab', { name: 'Details' }).getAttribute('aria-selected')).toBe(
      'true',
    )
    expect(screen.getByText('details', { selector: 'output' })).toBeTruthy()
  })

  it('navigates with arrow keys in horizontal and vertical orientations', async () => {
    render(<ExampleTabs />)
    const overviewTab = screen.getByRole('tab', { name: 'Overview' })
    const detailsTab = screen.getByRole('tab', { name: 'Details' })

    await act(async () => {
      overviewTab.focus()
      fireEvent.keyDown(overviewTab, { key: 'ArrowRight', code: 'ArrowRight' })
    })
    expect(document.activeElement).toBe(detailsTab)
    expect(detailsTab.getAttribute('aria-selected')).toBe('true')

    cleanup()
    render(
      <Tabs defaultValue="overview">
        <TabsList aria-label="Home and end sections">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">Overview panel</TabsContent>
        <TabsContent value="details">Details panel</TabsContent>
        <TabsContent value="activity">Activity panel</TabsContent>
      </Tabs>,
    )
    const firstTab = screen.getByRole('tab', { name: 'Overview' })
    const lastTab = screen.getByRole('tab', { name: 'Activity' })
    await act(async () => {
      firstTab.focus()
      fireEvent.keyDown(firstTab, { key: 'End', code: 'End' })
    })
    expect(document.activeElement).toBe(lastTab)
    await act(async () => {
      fireEvent.keyDown(lastTab, { key: 'Home', code: 'Home' })
    })
    expect(document.activeElement).toBe(firstTab)

    cleanup()
    render(
      <Tabs defaultValue="overview" orientation="vertical">
        <TabsList aria-label="Vertical sections">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">Overview panel</TabsContent>
        <TabsContent value="details">Details panel</TabsContent>
      </Tabs>,
    )
    const verticalOverviewTab = screen.getByRole('tab', { name: 'Overview' })
    const verticalDetailsTab = screen.getByRole('tab', { name: 'Details' })
    await act(async () => {
      verticalOverviewTab.focus()
      fireEvent.keyDown(verticalOverviewTab, { key: 'ArrowDown', code: 'ArrowDown' })
    })
    expect(document.activeElement).toBe(verticalDetailsTab)
    expect(verticalDetailsTab.getAttribute('aria-selected')).toBe('true')
  })
})
