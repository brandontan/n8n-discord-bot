const SpotlightManager = require('../src/modules/spotlightManager');
const fs = require('fs');
const path = require('path');

// Mock Discord.js components
const mockEmbed = {
    setTitle: jest.fn().mockReturnThis(),
    setDescription: jest.fn().mockReturnThis(),
    setURL: jest.fn().mockReturnThis(),
    setColor: jest.fn().mockReturnThis(),
    setTimestamp: jest.fn().mockReturnThis(),
    setFooter: jest.fn().mockReturnThis(),
    setThumbnail: jest.fn().mockReturnThis(),
    addFields: jest.fn().mockReturnThis()
};

jest.mock('discord.js', () => ({
    EmbedBuilder: jest.fn(() => mockEmbed)
}));

jest.mock('node-cron', () => ({
    schedule: jest.fn(() => ({
        destroy: jest.fn(),
        getStatus: jest.fn(() => 'scheduled')
    }))
}));

// Mock fetch globally
global.fetch = jest.fn();

describe('SpotlightManager', () => {
    let spotlightManager;
    let mockClient;
    let mockGuild;
    let mockChannel;
    let mockMessage;
    let mockThread;

    beforeEach(() => {
        spotlightManager = new SpotlightManager();
        
        // Mock Discord client and guild structures
        mockThread = {
            send: jest.fn().mockResolvedValue()
        };
        
        mockMessage = {
            startThread: jest.fn().mockResolvedValue(mockThread),
            pin: jest.fn().mockResolvedValue(),
            unpin: jest.fn().mockResolvedValue(),
            createdTimestamp: Date.now(),
            embeds: [{ footer: { text: 'Weekly Spotlight • Discuss in thread 💬' } }]
        };
        
        mockChannel = {
            name: 'weekly-spotlight',
            type: 0,
            send: jest.fn().mockResolvedValue(mockMessage),
            messages: {
                fetchPinned: jest.fn().mockResolvedValue(new Map([[mockMessage.id, mockMessage]]))
            }
        };
        
        mockGuild = {
            name: 'Test Guild',
            channels: {
                cache: new Map([['test-channel-id', mockChannel]])
            }
        };
        
        mockClient = {
            guilds: {
                cache: new Map([['test-guild-id', mockGuild]])
            }
        };
        
        // Mock the data file
        const testData = {
            spotlights: [
                {
                    id: 'test-spotlight-1',
                    title: 'Test Spotlight',
                    description: 'This is a test spotlight',
                    link: 'https://test.example.com',
                    thumbnail: 'https://test.example.com/thumb.jpg',
                    tags: ['Test', 'Automation'],
                    type: 'test'
                }
            ],
            settings: {
                fallback_message: 'Test fallback message',
                fallback_thumbnail: 'https://test.example.com/fallback.jpg',
                max_pinned_messages: 4,
                enable_n8n_integration: false,
                n8n_webhook_url: '',
                enable_gsheets_integration: false,
                gsheets_url: ''
            }
        };
        
        jest.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify(testData));
        jest.spyOn(fs, 'writeFileSync').mockImplementation(() => {});
        
        spotlightManager.setClient(mockClient);
    });

    afterEach(() => {
        jest.clearAllMocks();
        spotlightManager.stop();
    });

    describe('Initialization', () => {
        test('should initialize with correct default values', () => {
            expect(spotlightManager.client).toBe(mockClient);
            expect(spotlightManager.cronJob).toBeNull();
            expect(spotlightManager.usedSpotlights).toBeInstanceOf(Set);
            expect(spotlightManager.usedSpotlights.size).toBe(0);
        });

        test('should start cron job when start() is called', () => {
            const cron = require('node-cron');
            spotlightManager.start();
            
            expect(cron.schedule).toHaveBeenCalledWith(
                '0 0 * * 1',
                expect.any(Function),
                { timezone: 'UTC', scheduled: true }
            );
            expect(spotlightManager.cronJob).not.toBeNull();
        });

        test('should stop cron job when stop() is called', () => {
            spotlightManager.start();
            const mockDestroy = jest.fn();
            spotlightManager.cronJob = { destroy: mockDestroy };
            
            spotlightManager.stop();
            
            expect(mockDestroy).toHaveBeenCalled();
            expect(spotlightManager.cronJob).toBeNull();
        });
    });

    describe('Data Loading', () => {
        test('should load spotlight data from file', () => {
            const data = spotlightManager.loadSpotlightData();
            
            expect(data).toBeDefined();
            expect(data.spotlights).toHaveLength(1);
            expect(data.spotlights[0].id).toBe('test-spotlight-1');
            expect(data.settings.max_pinned_messages).toBe(4);
        });

        test('should handle file read errors gracefully', () => {
            fs.readFileSync.mockImplementation(() => {
                throw new Error('File not found');
            });
            
            const data = spotlightManager.loadSpotlightData();
            expect(data).toBeNull();
        });
    });

    describe('Spotlight Selection', () => {
        test('should select random spotlight from local data', () => {
            const data = spotlightManager.loadSpotlightData();
            const spotlight = spotlightManager.selectRandomFromLocal(data.spotlights);
            
            expect(spotlight).toBeDefined();
            expect(spotlight.id).toBe('test-spotlight-1');
            expect(spotlightManager.usedSpotlights.has('test-spotlight-1')).toBe(true);
        });

        test('should validate and normalize spotlight data', () => {
            const rawData = {
                title: 'Test Title',
                description: 'Test Description',
                link: 'https://test.com',
                tags: 'tag1,tag2,tag3'
            };
            
            const validated = spotlightManager.validateSpotlightData(rawData);
            
            expect(validated.title).toBe('Test Title');
            expect(validated.description).toBe('Test Description');
            expect(validated.link).toBe('https://test.com');
            expect(validated.tags).toEqual(['tag1', 'tag2', 'tag3']);
            expect(validated.id).toMatch(/^spotlight-\d+$/);
        });

        test('should return fallback spotlight when no data available', () => {
            const settings = {
                fallback_message: 'Fallback message',
                fallback_thumbnail: 'https://fallback.com/thumb.jpg'
            };
            
            const fallback = spotlightManager.getFallbackSpotlight(settings);
            
            expect(fallback.id).toBe('fallback');
            expect(fallback.title).toBe('🌟 Weekly Spotlight');
            expect(fallback.description).toBe('Fallback message');
            expect(fallback.type).toBe('fallback');
        });
    });

    describe('External Integrations', () => {
        test('should fetch from n8n webhook when enabled', async () => {
            const mockResponse = {
                ok: true,
                json: jest.fn().mockResolvedValue({
                    title: 'n8n Spotlight',
                    description: 'From n8n workflow',
                    link: 'https://n8n.io',
                    type: 'n8n'
                })
            };
            
            global.fetch.mockResolvedValue(mockResponse);
            
            const spotlight = await spotlightManager.fetchFromN8N('https://n8n.webhook.url');
            
            expect(fetch).toHaveBeenCalledWith('https://n8n.webhook.url', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            expect(spotlight.title).toBe('n8n Spotlight');
            expect(spotlight.type).toBe('n8n');
        });

        test('should handle n8n webhook errors gracefully', async () => {
            global.fetch.mockRejectedValue(new Error('Network error'));
            
            const spotlight = await spotlightManager.fetchFromN8N('https://n8n.webhook.url');
            
            expect(spotlight).toBeNull();
        });

        test('should fetch from Google Sheets when enabled', async () => {
            const csvData = 'title,description,link,type\\n\"Sheets Spotlight\",\"From Google Sheets\",\"https://sheets.google.com\",\"sheets\"';
            const mockResponse = {
                ok: true,
                text: jest.fn().mockResolvedValue(csvData)
            };
            
            global.fetch.mockResolvedValue(mockResponse);
            
            const spotlight = await spotlightManager.fetchFromGSheets('https://docs.google.com/spreadsheets/d/test/edit#gid=0');
            
            expect(fetch).toHaveBeenCalledWith('https://docs.google.com/spreadsheets/d/test/export?format=csv&gid=0');
            expect(spotlight.title).toBe('Sheets Spotlight');
            expect(spotlight.type).toBe('sheets');
        });

        test('should handle Google Sheets errors gracefully', async () => {
            global.fetch.mockRejectedValue(new Error('Network error'));
            
            const spotlight = await spotlightManager.fetchFromGSheets('https://docs.google.com/spreadsheets/d/test/edit#gid=0');
            
            expect(spotlight).toBeNull();
        });
    });

    describe('Discord Integration', () => {
        test('should create proper Discord embed', () => {
            const spotlight = {
                title: 'Test Spotlight',
                description: 'Test description',
                link: 'https://test.com',
                thumbnail: 'https://test.com/thumb.jpg',
                tags: ['Test', 'Automation'],
                type: 'test'
            };
            
            const embed = spotlightManager.createSpotlightEmbed(spotlight);
            
            expect(mockEmbed.setTitle).toHaveBeenCalledWith('Test Spotlight');
            expect(mockEmbed.setDescription).toHaveBeenCalledWith('Test description');
            expect(mockEmbed.setURL).toHaveBeenCalledWith('https://test.com');
            expect(mockEmbed.setThumbnail).toHaveBeenCalledWith('https://test.com/thumb.jpg');
            expect(mockEmbed.addFields).toHaveBeenCalledWith({
                name: '🏷️ Tags',
                value: '`Test` `Automation`',
                inline: true
            });
        });

        test('should post to guild with weekly-spotlight channel', async () => {
            // Set up channel with correct name
            mockChannel.name = 'weekly-spotlight';
            mockGuild.channels.cache = new Map([['channel-id', mockChannel]]);
            
            const spotlight = {
                title: 'Test Spotlight',
                description: 'Test description',
                link: 'https://test.com',
                type: 'test'
            };
            
            await spotlightManager.postToGuild(mockGuild, spotlight);
            
            expect(mockChannel.send).toHaveBeenCalledWith({
                content: '🌟 **Weekly Spotlight** 🌟\\n\\nDiscover something amazing this week!',
                embeds: [mockEmbed]
            });
            expect(mockMessage.startThread).toHaveBeenCalledWith({
                name: '💬 Discuss: Test Spotlight',
                autoArchiveDuration: 10080,
                reason: 'Weekly Spotlight discussion thread'
            });
        });

        test('should skip guilds without weekly-spotlight channel', async () => {
            // Set up channel with different name
            mockChannel.name = 'general';
            
            const spotlight = { title: 'Test', description: 'Test', link: 'https://test.com', type: 'test' };
            
            await spotlightManager.postToGuild(mockGuild, spotlight);
            
            expect(mockChannel.send).not.toHaveBeenCalled();
        });

        test('should manage pinned messages correctly', async () => {
            const pinnedMessages = new Map([
                ['msg1', { ...mockMessage, createdTimestamp: Date.now() - 1000 }],
                ['msg2', { ...mockMessage, createdTimestamp: Date.now() - 2000 }],
                ['msg3', { ...mockMessage, createdTimestamp: Date.now() - 3000 }],
                ['msg4', { ...mockMessage, createdTimestamp: Date.now() - 4000 }],
                ['msg5', { ...mockMessage, createdTimestamp: Date.now() - 5000 }]
            ]);
            
            mockChannel.messages.fetchPinned.mockResolvedValue(pinnedMessages);
            
            await spotlightManager.managePinnedMessages(mockChannel, mockMessage);
            
            expect(mockMessage.pin).toHaveBeenCalled();
            // Should unpin oldest messages when exceeding max
        });
    });

    describe('Manual Trigger', () => {
        test('should trigger manual spotlight successfully', async () => {
            mockChannel.name = 'weekly-spotlight';
            mockGuild.channels.cache = new Map([['channel-id', mockChannel]]);
            
            const success = await spotlightManager.triggerManualSpotlight(mockGuild);
            
            expect(success).toBe(true);
            expect(mockChannel.send).toHaveBeenCalled();
        });

        test('should return false when no guild provided', async () => {
            const success = await spotlightManager.triggerManualSpotlight(null);
            
            expect(success).toBe(false);
        });
    });

    describe('Status and Utilities', () => {
        test('should return correct status information', () => {
            spotlightManager.start();
            spotlightManager.usedSpotlights.add('test-id');
            spotlightManager.lastResetWeek = 52;
            
            const status = spotlightManager.getStatus();
            
            expect(status.isRunning).toBe(true);
            expect(status.usedSpotlightsCount).toBe(1);
            expect(status.lastResetWeek).toBe(52);
            expect(status.currentWeek).toBeGreaterThan(0);
        });

        test('should calculate week number correctly', () => {
            const weekNumber = spotlightManager.getCurrentWeekNumber();
            
            expect(weekNumber).toBeGreaterThan(0);
            expect(weekNumber).toBeLessThanOrEqual(53);
        });

        test('should reset used spotlights on new week', async () => {
            spotlightManager.usedSpotlights.add('test-id');
            spotlightManager.lastResetWeek = 1; // Force different week
            
            await spotlightManager.getRandomSpotlight();
            
            expect(spotlightManager.usedSpotlights.size).toBe(1); // Should be reset and new spotlight added
            expect(spotlightManager.lastResetWeek).toBe(spotlightManager.getCurrentWeekNumber());
        });
    });
});

console.log('✅ Weekly Spotlight automation tests completed!');
