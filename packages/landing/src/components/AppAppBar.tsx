'use client'
import * as React from 'react'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Container from '@mui/material/Container'
import MenuItem from '@mui/material/MenuItem'
import Drawer from '@mui/material/Drawer'
import MenuIcon from '@mui/icons-material/Menu'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import Typography from '@mui/material/Typography'

export default function AppAppBar() {
  const [open, setOpen] = React.useState(false)

  const toggleDrawer = (newOpen: boolean) => () => {
    setOpen(newOpen)
  }

  return (
    <AppBar
      position="fixed"
      enableColorOnDark
      className="border-b border-white/10 bg-black bg-none shadow-none"
    >
      <Container maxWidth="lg">
        <Toolbar
          variant="dense"
          disableGutters
          className="flex shrink-0 items-center justify-between py-2 backdrop-blur-2xl"
        >
          <div className="hidden flex-grow items-center gap-6 md:flex">
            <Typography
              variant="h6"
              component="a"
              href="/"
              noWrap
              className="font-bold text-zinc-200 no-underline"
            >
              Project 210
            </Typography>
            <nav>
              <ul className="m-0 flex list-none gap-2 p-0">
                <li>
                  <Button
                    component="a"
                    href="/roadmap"
                    variant="text"
                    className="text-zinc-200"
                    size="medium"
                  >
                    Roadmap
                  </Button>
                </li>
              </ul>
            </nav>
          </div>
          <div className="hidden items-center md:flex">
            <Button
              component="a"
              href="/signup"
              variant="contained"
              size="medium"
              className="bg-zinc-200 text-black hover:bg-zinc-300"
            >
              Get Started
            </Button>
          </div>
          <div className="flex gap-2 md:hidden">
            <IconButton
              className="text-zinc-200"
              aria-label="Menu button"
              onClick={toggleDrawer(true)}
            >
              <MenuIcon />
            </IconButton>
            <Drawer
              anchor="top"
              open={open}
              onClose={toggleDrawer(false)}
              slotProps={{
                paper: {
                  className: 'top-[var(--template-frame-height,0px)]',
                },
              }}
            >
              <div className="bg-white p-4">
                <div className="flex justify-end">
                  <IconButton onClick={toggleDrawer(false)}>
                    <CloseRoundedIcon />
                  </IconButton>
                </div>

                <MenuItem>Features</MenuItem>
                <MenuItem>Testimonials</MenuItem>
                <MenuItem>Highlights</MenuItem>
                <MenuItem>Pricing</MenuItem>
                <MenuItem>FAQ</MenuItem>
                <MenuItem>Blog</MenuItem>
              </div>
            </Drawer>
          </div>
        </Toolbar>
      </Container>
    </AppBar>
  )
}
