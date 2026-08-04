using KampusEtkinlik.Api.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace KampusEtkinlik.Api.Data;

public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
{
    public ApplicationDbContext(
        DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<Club> Clubs => Set<Club>();

    public DbSet<Event> Events => Set<Event>();

    public DbSet<Registration> Registrations => Set<Registration>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<ApplicationUser>()
            .ToTable("Users");

        builder.Entity<Club>()
            .HasOne(club => club.ManagerUser)
            .WithMany(user => user.ManagedClubs)
            .HasForeignKey(club => club.ManagerUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<Event>()
            .HasOne(eventItem => eventItem.Club)
            .WithMany(club => club.Events)
            .HasForeignKey(eventItem => eventItem.ClubId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<Registration>()
            .HasOne(registration => registration.User)
            .WithMany(user => user.Registrations)
            .HasForeignKey(registration => registration.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<Registration>()
            .HasOne(registration => registration.Event)
            .WithMany(eventItem => eventItem.Registrations)
            .HasForeignKey(registration => registration.EventId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<Registration>()
            .HasIndex(registration => new
            {
                registration.UserId,
                registration.EventId
            })
            .IsUnique();

        builder.Entity<Event>()
            .Property(eventItem => eventItem.Visibility)
            .HasConversion<string>()
            .HasMaxLength(30);

        builder.Entity<Event>()
            .Property(eventItem => eventItem.Status)
            .HasConversion<string>()
            .HasMaxLength(30);

        builder.Entity<Registration>()
            .Property(registration => registration.ApprovalStatus)
            .HasConversion<string>()
            .HasMaxLength(30);

        builder.Entity<Event>()
            .HasIndex(eventItem => eventItem.StartDate);

        builder.Entity<Event>()
            .HasIndex(eventItem => eventItem.ClubId);
    }
}