import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ThumbsUp, Heart, Download, Share2, Eye, Clock, User } from 'lucide-react';
import { videosAPI } from '../api/studyAI';
import FloatingWorkspaceButton from '../components/FloatingWorkspaceButton';

interface Video {
  _id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  videoUrl: string;
  youtubeId: string;
  durationSec: number;
  channelName: string;
  topicTags: string[];
  views: number;
  likes: number;
  saves: number;
  uploadedAt: string;
  playlistId?: string;
  playlistTitle?: string;
  episodeNumber?: number;
}

const VideoPlayer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [video, setVideo] = useState<Video | null>(null);
  const [relatedVideos, setRelatedVideos] = useState<Video[]>([]);
  const [playlistVideos, setPlaylistVideos] = useState<Video[]>([]);
  const [playlistInfo, setPlaylistInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    if (id) {
      fetchVideoData(id);
    }
  }, [id]);

  const fetchVideoData = async (videoId: string) => {
    try {
      setLoading(true);
      
      // Fetch video details
      const videoResponse = await videosAPI.getVideoById(videoId);
      const videoData = videoResponse.data;
      setVideo(videoData);

      // Check if video is part of a playlist
      if (videoData.playlistId) {
        // Fetch playlist videos
        const playlistResponse = await videosAPI.getPlaylistVideos(videoData.playlistId);
        setPlaylistVideos(playlistResponse.data.videos);
        setPlaylistInfo(playlistResponse.data.playlist);
        setRelatedVideos([]); // Clear related videos for playlist view
      } else {
        // Fetch related videos for standalone videos
        const relatedResponse = await videosAPI.getRelatedVideos(videoId, 10);
        setRelatedVideos(relatedResponse.data);
        setPlaylistVideos([]); // Clear playlist videos
        setPlaylistInfo(null);
      }
      
    } catch (error) {
      console.error('Error fetching video data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatViews = (views: number) => {
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M`;
    } else if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K`;
    }
    return views.toString();
  };

  const handleVideoClick = (videoId: string) => {
    navigate(`/video/${videoId}`);
  };

  const handleLike = async () => {
    try {
      if (video) {
        await videosAPI.likeVideo(video._id);
        setIsLiked(!isLiked);
        setVideo({ ...video, likes: video.likes + (isLiked ? -1 : 1) });
      }
    } catch (error) {
      console.error('Error liking video:', error);
    }
  };

  const handleSave = async () => {
    try {
      if (video) {
        await videosAPI.saveVideo(video._id);
        setIsSaved(!isSaved);
        setVideo({ ...video, saves: video.saves + (isSaved ? -1 : 1) });
      }
    } catch (error) {
      console.error('Error saving video:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Video not found</h2>
          <p className="text-gray-600">The video you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Video Section */}
          <div className="lg:col-span-2">
            {/* Video Player */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-4">
              <div className="relative aspect-video bg-black">
                <iframe
                  src={`https://www.youtube.com/embed/${video.youtubeId}`}
                  title={video.title}
                  className="w-full h-full"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            </div>

            {/* Video Info */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-3">{video.title}</h1>
              
              {/* Playlist Info (if part of a series) */}
              {video.playlistId && (
                <div className="mb-3 p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-indigo-800">
                        Episode {video.episodeNumber} of {playlistInfo?.totalEpisodes}
                      </p>
                      <p className="text-xs text-indigo-600">{video.playlistTitle}</p>
                    </div>
                    <div className="text-xs text-indigo-600">
                      Series: {Math.floor((playlistInfo?.totalDuration || 0) / 60)} min total
                    </div>
                  </div>
                </div>
              )}
              
              {/* Video Stats */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Eye className="h-4 w-4" />
                    <span>{formatViews(video.views)} views</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>{new Date(video.uploadedAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleLike}
                    className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isLiked
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <ThumbsUp className="h-4 w-4" />
                    <span>{formatViews(video.likes)}</span>
                  </button>
                  
                  <button
                    onClick={handleSave}
                    className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isSaved
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Heart className="h-4 w-4" />
                    <span>Save</span>
                  </button>
                  
                  <button className="flex items-center space-x-1 px-3 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors">
                    <Download className="h-4 w-4" />
                    <span>Download</span>
                  </button>
                  
                  <button className="flex items-center space-x-1 px-3 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors">
                    <Share2 className="h-4 w-4" />
                    <span>Share</span>
                  </button>
                </div>
              </div>

              {/* Channel Info */}
              <div className="flex items-center space-x-3 mb-4">
                <div className="h-10 w-10 bg-indigo-600 rounded-full flex items-center justify-center">
                  <User className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{video.channelName}</h3>
                  <p className="text-sm text-gray-600">Educational Channel</p>
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                {video.topicTags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-indigo-100 text-indigo-800 text-sm rounded-full"
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              {/* Description */}
              <div className="border-t pt-4">
                <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                <p className="text-gray-600 leading-relaxed">{video.description}</p>
              </div>
            </div>
          </div>

          {/* Sidebar - Playlist or Related Videos */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-4">
              {/* Playlist Section */}
              {playlistInfo && playlistVideos.length > 0 ? (
                <>
                  <div className="mb-4">
                    <h3 className="font-bold text-lg text-gray-900 mb-1">{playlistInfo.playlistTitle}</h3>
                    <p className="text-sm text-gray-600">
                      {playlistInfo.totalEpisodes} episodes • {Math.floor(playlistInfo.totalDuration / 60)} min total
                    </p>
                  </div>
                  
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {playlistVideos.map((playlistVideo, index) => (
                      <div
                        key={playlistVideo._id}
                        onClick={() => handleVideoClick(playlistVideo._id)}
                        className={`flex space-x-3 cursor-pointer p-2 rounded-lg transition-colors ${
                          playlistVideo._id === video?._id 
                            ? 'bg-indigo-50 border border-indigo-200' 
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex-shrink-0">
                          <div className="relative">
                            <img
                              src={playlistVideo.thumbnailUrl}
                              alt={playlistVideo.title}
                              className="w-20 h-12 object-cover rounded"
                            />
                            <div className="absolute bottom-0.5 right-0.5 bg-black bg-opacity-75 text-white text-xs px-1 rounded">
                              {formatDuration(playlistVideo.durationSec)}
                            </div>
                            {playlistVideo._id === video?._id && (
                              <div className="absolute inset-0 bg-indigo-600 bg-opacity-20 rounded flex items-center justify-center">
                                <div className="bg-indigo-600 text-white text-xs px-1 py-0.5 rounded font-medium">
                                  Now Playing
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start space-x-2">
                            <span className="text-xs font-medium text-gray-500 mt-0.5">
                              {playlistVideo.episodeNumber || index + 1}.
                            </span>
                            <div className="flex-1">
                              <h4 className={`text-sm font-medium line-clamp-2 mb-1 ${
                                playlistVideo._id === video?._id 
                                  ? 'text-indigo-600' 
                                  : 'text-gray-900'
                              }`}>
                                {playlistVideo.title}
                              </h4>
                              <div className="flex items-center space-x-2 text-xs text-gray-500">
                                <span>{formatViews(playlistVideo.views)} views</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                /* Related Videos Section */
                <>
                  <h3 className="font-bold text-lg text-gray-900 mb-4">Related Videos</h3>
                  
                  <div className="space-y-4">
                    {relatedVideos.map((relatedVideo) => (
                      <div
                        key={relatedVideo._id}
                        onClick={() => handleVideoClick(relatedVideo._id)}
                        className="flex space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
                      >
                        <div className="flex-shrink-0">
                          <div className="relative">
                            <img
                              src={relatedVideo.thumbnailUrl}
                              alt={relatedVideo.title}
                              className="w-24 h-16 object-cover rounded"
                            />
                            <div className="absolute bottom-1 right-1 bg-black bg-opacity-75 text-white text-xs px-1 rounded">
                              {formatDuration(relatedVideo.durationSec)}
                            </div>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">
                            {relatedVideo.title}
                          </h4>
                          <p className="text-xs text-gray-600 mb-1">
                            {relatedVideo.channelName}
                          </p>
                          <div className="flex items-center space-x-2 text-xs text-gray-500">
                            <span>{formatViews(relatedVideo.views)} views</span>
                            <span>•</span>
                            <span>{new Date(relatedVideo.uploadedAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Workspace Button */}
      {video && (
        <FloatingWorkspaceButton
          content={{
            id: video._id,
            title: video.title,
            type: 'video',
            url: video.videoUrl,
            videoData: video,
            currentTime: currentTime,
            progress: video.durationSec > 0 ? (currentTime / video.durationSec) * 100 : 0
          }}
          isVisible={true}
        />
      )}
    </div>
  );
};

export default VideoPlayer;