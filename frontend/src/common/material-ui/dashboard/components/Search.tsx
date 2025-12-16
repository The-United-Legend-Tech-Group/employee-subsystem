'use client';
import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import FormControl from '@mui/material/FormControl';
import InputAdornment from '@mui/material/InputAdornment';
import OutlinedInput from '@mui/material/OutlinedInput';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import Paper from '@mui/material/Paper';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Popper from '@mui/material/Popper';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { mainListItems, performanceSubItems, MenuItem } from './MenuContent';
import { getUserRoles } from '../../../utils/cookie-utils';

export default function Search() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const anchorRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load user roles on client side
  useEffect(() => {
    setUserRoles(getUserRoles());
  }, []);

  // Keyboard shortcut: Ctrl+F to focus search bar
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'f') {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Combine all menu items and filter based on roles and search query
  const allItems: MenuItem[] = [
    ...mainListItems,
    ...performanceSubItems.map(item => ({
      ...item,
      text: `Performance > ${item.text}`, // Prefix performance items
    })),
  ];

  // Filter items based on user roles
  const roleFilteredItems = allItems.filter(item => {
    if (item.roles && item.roles.length > 0) {
      return item.roles.some(role => userRoles.includes(role));
    }
    return true;
  });

  // Filter items based on search query
  const filteredItems = roleFilteredItems.filter(item =>
    item.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle search input change
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchQuery(value);
    setIsOpen(value.length > 0);
    setSelectedIndex(0);
  };

  // Handle item selection
  const handleItemClick = (item: MenuItem) => {
    if (item.path) {
      router.push(item.path);
    }
    setSearchQuery('');
    setIsOpen(false);
  };

  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!isOpen || filteredItems.length === 0) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setSelectedIndex(prev =>
          prev < filteredItems.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        event.preventDefault();
        setSelectedIndex(prev =>
          prev > 0 ? prev - 1 : filteredItems.length - 1
        );
        break;
      case 'Enter':
        event.preventDefault();
        if (filteredItems[selectedIndex]) {
          handleItemClick(filteredItems[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSearchQuery('');
        break;
    }
  };

  // Handle click away
  const handleClickAway = () => {
    setIsOpen(false);
  };

  return (
    <ClickAwayListener onClickAway={handleClickAway}>
      <Box sx={{ position: 'relative' }}>
        <FormControl
          sx={{ width: { xs: '100%', md: '32ch' } }}
          variant="outlined"
          ref={anchorRef}
        >
          <OutlinedInput
            size="small"
            id="search"
            placeholder="Search pages… (Ctrl+F)"
            value={searchQuery}
            onChange={handleSearchChange}
            onKeyDown={handleKeyDown}
            onFocus={() => searchQuery.length > 0 && setIsOpen(true)}
            inputRef={inputRef}
            sx={{ flexGrow: 1 }}
            startAdornment={
              <InputAdornment position="start" sx={{ color: 'text.primary' }}>
                <SearchRoundedIcon fontSize="small" />
              </InputAdornment>
            }
            inputProps={{
              'aria-label': 'search pages',
              autoComplete: 'off',
            }}
          />
        </FormControl>

        <Popper
          open={isOpen && filteredItems.length > 0}
          anchorEl={anchorRef.current}
          placement="bottom-start"
          style={{ zIndex: 1300, width: anchorRef.current?.offsetWidth || 300 }}
        >
          <Paper
            elevation={8}
            sx={{
              mt: 0.5,
              maxHeight: 300,
              overflow: 'auto',
              minWidth: 280,
            }}
          >
            <List dense sx={{ py: 0.5 }}>
              {filteredItems.map((item, index) => (
                <ListItem key={item.path || index} disablePadding>
                  <ListItemButton
                    selected={index === selectedIndex}
                    onClick={() => handleItemClick(item)}
                    sx={{
                      py: 0.75,
                      '&.Mui-selected': {
                        bgcolor: 'action.selected',
                      },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.text}
                      primaryTypographyProps={{
                        variant: 'body2',
                        noWrap: true,
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Paper>
        </Popper>

        {isOpen && searchQuery.length > 0 && filteredItems.length === 0 && (
          <Popper
            open={true}
            anchorEl={anchorRef.current}
            placement="bottom-start"
            style={{ zIndex: 1300, width: anchorRef.current?.offsetWidth || 300 }}
          >
            <Paper elevation={8} sx={{ mt: 0.5, p: 2, minWidth: 280 }}>
              <Typography variant="body2" color="text.secondary">
                No pages found
              </Typography>
            </Paper>
          </Popper>
        )}
      </Box>
    </ClickAwayListener>
  );
}
